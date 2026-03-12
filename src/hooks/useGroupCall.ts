// src/hooks/useGroupCall.ts

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
// import { getSocket } from "@/lib/socket"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  joinGroupCall,
  leaveGroupCall,
  addParticipant,
  removeParticipant,
  toggleAudio,
  setGroupCallActive,
  setGroupCallEnded,
  updateGroupCallCount,
} from "@/store/slices/groupCallSlice"
import type { RootState } from "@/store/store"
import {
  closeAudioContext,
  getAudioContext,
  playGroupRemoteStream,
  stopAllGroupStreams,
  stopGroupRemoteStream,
} from "@/utils/audioPlayback"
import {
  PeerConnectionManager,
  type IceCandidateData,
  type SdpData,
} from "@/lib/webrtc/PeerConnectionManager"
import { fetchUsersBulkThunk } from "@/store/thunks/usersThunk"
import { useSocket } from "@/providers/SocketProvider"

interface PeerEntry {
  manager: PeerConnectionManager
  userId: string
  socketId: string
}

export const useGroupCall = (userId: string | null) => {
  const dispatch = useAppDispatch()
  const { groupId } = useAppSelector((s: RootState) => s.groupCall)
  // const callParticipantsCache = useAppSelector(
  //   (s: RootState) => s.users.callParticipantsCache
  // )

  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({})
  const peersRef = useRef<Record<string, PeerEntry>>({})
  const localStreamRef = useRef<MediaStream | null>(null)
  const socket = useSocket()
  // const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)
  const audioEnabledRef = useRef<boolean>(true) // 🔹 Реф для актуального состояния без зависимостей

  // ---- Локальный стрим ----
  const getOrCreateLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        sampleRate: 48000,
        channelCount: 1,
      },
    })

    // Применяем текущее состояние мута при создании
    stream.getAudioTracks().forEach((t) => {
      t.enabled = audioEnabledRef.current
    })

    await getAudioContext().resume()
    localStreamRef.current = stream
    return stream
  }

  // ---- Создать PeerConnection ----
  const createPeer = useCallback(
    (
      toSocketId: string,
      toUserId: string,
      initiator: boolean,
      stream: MediaStream,
    ) => {
      if (peersRef.current[toSocketId])
        return peersRef.current[toSocketId].manager

      const manager = new PeerConnectionManager({
        initiator,
        remoteUserId: toUserId,
        remoteSocketId: toSocketId,
        localStream: stream,
        events: {
          onSignal: ({ type, payload }) => {
            // const socket = socketRef.current
            if (!socket) return

            if (type === "ice-candidate") {
              socket.emit("group-call:ice-candidate", {
                toSocketId,
                candidate: payload as IceCandidateData,
              })
            } else {
              // offer | answer
              socket.emit("group-call:sdp", {
                toSocketId,
                sdpType: type,
                payload: payload as SdpData,
              })
            }
          },
          onStream: (remoteStream) => {
            setRemoteStreams((prev) => ({
              ...prev,
              [toSocketId]: remoteStream,
            }))
            playGroupRemoteStream(toSocketId, remoteStream)
          },
          onError: (err) => {
            console.error(`[useGroupCall] Peer error ${toSocketId}:`, err)
            destroyPeer(toSocketId)
          },
          onClose: () => {
            destroyPeer(toSocketId)
          },
        },
      })

      peersRef.current[toSocketId] = {
        manager,
        userId: toUserId,
        socketId: toSocketId,
      }

      dispatch(
        addParticipant({
          userId: toUserId,
          socketId: toSocketId,
          audioEnabled: true,
          // videoEnabled: false,
        }),
      )

      return manager
    },
    [dispatch, socket],
  )

  // ---- Удалить Peer ----
  const destroyPeer = useCallback(
    (socketId: string) => {
      const entry = peersRef.current[socketId]
      if (entry) {
        entry.manager.close(true)
        delete peersRef.current[socketId]
      }
      stopGroupRemoteStream(socketId)
      setRemoteStreams((prev) => {
        const next = { ...prev }
        delete next[socketId]
        return next
      })
      dispatch(removeParticipant({ socketId }))
    },
    [dispatch],
  )

  // ---- Socket события ----
  useEffect(() => {
    if (!userId || !socket) return
    // const token = localStorage.getItem("accessToken")
    // if (!token) return

    // if (!socketRef.current) {
    //   socketRef.current = getSocket(token)
    // }

    // const socket = socketRef.current
    // if (socket&&!socket.connected) socket.connect()

    // 📥 Кто уже в комнате
    socket.on(
      "group-call:existing-participants",
      async ({
        participants,
      }: {
        participants: { userId: string; socketId: string }[]
      }) => {
        if (!participants.length) return

        const ids = participants
          .map((p) => p.userId)
          .filter((id) => id !== userId) // не запрашиваем себя

        if (ids.length > 0) {
          dispatch(fetchUsersBulkThunk(ids)) // 👈 Санка сама отфильтрует кэш!
        }

        const stream = await getOrCreateLocalStream()
        for (const p of participants) {
          if (p.socketId !== socket.id && !peersRef.current[p.socketId]) {
            createPeer(p.socketId, p.userId, true, stream) // Мы звоним первым
          }
        }
      },
    )

    // 🆕 Новый участник
    socket.on(
      "group-call:user-joined",
      async ({
        userId: joinedUserId,
        socketId,
      }: {
        userId: string
        socketId: string
      }) => {
        const stream = await getOrCreateLocalStream()
        if (joinedUserId !== userId) {
          // не запрашиваем себя
          dispatch(fetchUsersBulkThunk([joinedUserId])) // 👈 Просто диспатчим!
        }

        // Мы НЕ инициатор: новый участник сам создаст соединение к нам
        createPeer(socketId, joinedUserId, false, stream)
      },
    )

    // 📡 SDP (offer/answer)
    socket.on(
      "group-call:sdp",
      async ({
        fromSocketId,
        fromUserId,
        sdpType,
        payload,
      }: {
        fromSocketId: string
        fromUserId: string
        sdpType: "offer" | "answer"
        payload: SdpData
      }) => {
        let manager = peersRef.current[fromSocketId]?.manager

        if (!manager) {
          // Peer ещё не создан — создаём как receiver
          const stream = await getOrCreateLocalStream()
          manager = createPeer(fromSocketId, fromUserId, false, stream)
        }

        if (manager) {
          await manager.handleSignal({ type: sdpType, payload })
        }
      },
    )

    // ❄️ ICE candidate
    socket.on(
      "group-call:ice-candidate",
      async ({
        fromSocketId,
        fromUserId,
        candidate,
      }: {
        fromSocketId: string
        fromUserId: string
        candidate: IceCandidateData
      }) => {
        let manager = peersRef.current[fromSocketId]?.manager

        if (!manager) {
          // Создаём если ещё нет (edge case)
          const stream = await getOrCreateLocalStream()
          manager = createPeer(fromSocketId, fromUserId, false, stream)
        }

        if (manager) {
          await manager.handleSignal({
            type: "ice-candidate",
            payload: candidate,
          })
        }
      },
    )

    // 🚪 Участник вышел
    socket.on("group-call:user-left", ({ socketId }: { socketId: string }) => {
      destroyPeer(socketId)
    })

    // 📢 Статусы звонка
    socket.on("group-call:active", ({ groupId, participantsCount }) => {
      dispatch(setGroupCallActive({ groupId, participantsCount }))
    })
    socket.on("group-call:ended", ({ groupId }) => {
      dispatch(setGroupCallEnded({ groupId }))
    })
    socket.on(
      "group-call:participants-count",
      ({ groupId, participantsCount }) => {
        dispatch(updateGroupCallCount({ groupId, participantsCount }))
      },
    )

    return () => {
      socket.off("group-call:existing-participants")
      socket.off("group-call:user-joined")
      socket.off("group-call:sdp")
      socket.off("group-call:ice-candidate")
      socket.off("group-call:user-left")
      socket.off("group-call:active")
      socket.off("group-call:ended")
      socket.off("group-call:participants-count")
    }
  }, [userId, createPeer, destroyPeer, dispatch, socket])

  // ---- Присоединиться ----
  const joinCall = useCallback(
    async (gId: string) => {
      if (!socket) return
      await getOrCreateLocalStream()
      dispatch(joinGroupCall({ groupId: gId }))
      socket.emit("group-call:join", { groupId: gId })
    },
    [dispatch, socket],
  )

  // ---- Покинуть ----
  const leaveCall = useCallback(() => {
    if (!socket) return

    // if (!socketRef.current) return
    if (groupId) {
      socket.emit("group-call:leave", { groupId })
    }

    // Закрываем все соединения
    Object.keys(peersRef.current).forEach(destroyPeer)

    // Останавливаем локальный стрим
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null

    stopAllGroupStreams()
    closeAudioContext()
    dispatch(leaveGroupCall())
  }, [groupId, destroyPeer, dispatch, socket])

  // ---- Мут аудио ----
  const handleToggleAudio = useCallback(() => {
    audioEnabledRef.current = !audioEnabledRef.current

    // Мутим локальный трек
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = audioEnabledRef.current
    })

    // Обновляем все активные peer-соединения
    Object.values(peersRef.current).forEach(({ manager }) => {
      manager.toggleLocalAudio(audioEnabledRef.current)
    })

    dispatch(toggleAudio())
  }, [dispatch])

  return useMemo(
    () => ({
      localStream: localStreamRef.current,
      remoteStreams,
      joinCall,
      leaveCall,
      handleToggleAudio,
    }),
    [remoteStreams, joinCall, leaveCall, handleToggleAudio],
  )
}
