import { useEffect, useRef, useState, useCallback } from "react"
import Peer from "simple-peer"
import { getSocket } from "@/lib/socket"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  joinGroupCall,
  leaveGroupCall,
  addParticipant,
  removeParticipant,
  toggleAudio,
  toggleVideo,
  setGroupCallActive,
  setGroupCallEnded,
  updateGroupCallCount,
} from "@/store/slices/groupCallSlice"
import type { RootState } from "@/store/store"
import type { SignalData } from "simple-peer"

interface PeerEntry {
  peer: Peer.Instance
  userId: string
  socketId: string
  stream: MediaStream | null
}

export const useGroupCall = (userId: string | null) => {
  const dispatch = useAppDispatch()
  const {
    groupId,
    // isAudioEnabled, isVideoEnabled
  } = useAppSelector((s: RootState) => s.groupCall)

  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({}) // socketId -> stream

  const peersRef = useRef<Record<string, PeerEntry>>({}) // socketId -> PeerEntry
  const localStreamRef = useRef<MediaStream | null>(null)
  //   const socketRef = useRef(getSocket(localStorage.getItem("accessToken") || ""))
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)

  // ---- Локальный стрим ----
  const getOrCreateLocalStream = async (withVideo = false) => {
    if (localStreamRef.current) return localStreamRef.current

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1,
      },
      video: withVideo
        ? { width: { ideal: 1280 }, height: { ideal: 720 } }
        : false,
    })

    localStreamRef.current = stream
    return stream
  }

  // ---- Создать peer (initiator = мы звоним первыми) ----
  const createPeer = useCallback(
    (
      toSocketId: string,
      toUserId: string,
      initiator: boolean,
      stream: MediaStream
    ) => {
      if (!socketRef.current) return
      if (peersRef.current[toSocketId]) return peersRef.current[toSocketId].peer

      const peer = new Peer({
        initiator,
        trickle: false,
        stream,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      })

      peer.on("signal", (signal) => {
        if (!socketRef.current) return
        socketRef.current.emit("group-call:signal", { toSocketId, signal })
      })

      peer.on("stream", (remoteStream) => {
        setRemoteStreams((prev) => ({ ...prev, [toSocketId]: remoteStream }))
        peersRef.current[toSocketId].stream = remoteStream
      })

      peer.on("error", (err) => {
        console.error("Peer error", toSocketId, err)
        destroyPeer(toSocketId)
      })

      peer.on("close", () => {
        destroyPeer(toSocketId)
      })

      peersRef.current[toSocketId] = {
        peer,
        userId: toUserId,
        socketId: toSocketId,
        stream: null,
      }

      dispatch(
        addParticipant({
          userId: toUserId,
          socketId: toSocketId,
          audioEnabled: true,
          videoEnabled: false,
        })
      )

      return peer
    },
    [dispatch]
  )

  // ---- Удалить peer ----
  const destroyPeer = useCallback(
    (socketId: string) => {
      const entry = peersRef.current[socketId]
      if (entry) {
        entry.peer.removeAllListeners()
        entry.peer.destroy()
        delete peersRef.current[socketId]
      }
      setRemoteStreams((prev) => {
        const next = { ...prev }
        delete next[socketId]
        return next
      })
      dispatch(removeParticipant({ socketId }))
    },
    [dispatch]
  )

  // ---- Socket события ----
  useEffect(() => {
    if (!userId) return

    const token = localStorage.getItem("accessToken")
    if (!token) return

    if (!socketRef.current) {
      socketRef.current = getSocket(token)
    }

    const socket = socketRef.current
    if (!socket.connected) socket.connect()

    // Нам сообщили кто уже в комнате — создаём peer как initiator к каждому
    socket.on(
      "group-call:existing-participants",
      async ({
        participants,
      }: {
        participants: { userId: string; socketId: string }[]
      }) => {
        if (!participants.length) return
        const stream = await getOrCreateLocalStream()
        for (const p of participants) {
          if (p.socketId !== socket.id) {
            const peer = createPeer(p.socketId, p.userId, true, stream)
            if (!peer) continue // 👈
          }
        }
      }
    )

    // Новый участник зашёл — создаём peer как receiver
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
        createPeer(socketId, joinedUserId, false, stream)
      }
    )

    // Получили сигнал от другого участника
    socket.on(
      "group-call:signal",
      ({
        fromSocketId,
        fromUserId,
        signal,
      }: {
        fromSocketId: string
        fromUserId: string
        signal: SignalData
      }) => {
        if (peersRef.current[fromSocketId]) {
          peersRef.current[fromSocketId].peer.signal(signal)
        } else {
          // Peer ещё не создан — создаём и сразу сигналим
          getOrCreateLocalStream().then((stream) => {
            const peer = createPeer(fromSocketId, fromUserId, false, stream)
            if (!peer) return
            peer.signal(signal)
          })
        }
      }
    )

    // Участник вышел
    socket.on("group-call:user-left", ({ socketId }: { socketId: string }) => {
      destroyPeer(socketId)
    })

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
      }
    )

    return () => {
      socket.off("group-call:existing-participants")
      socket.off("group-call:user-joined")
      socket.off("group-call:signal")
      socket.off("group-call:user-left")

      socket.off("group-call:active")
      socket.off("group-call:ended")
      socket.off("group-call:participants-count")
    }
  }, [userId, createPeer, destroyPeer])

  // ---- Присоединиться к беседе ----
  const joinCall = useCallback(
    async (gId: string) => {
      if (!socketRef.current) return
      await getOrCreateLocalStream()
      dispatch(joinGroupCall({ groupId: gId }))
      socketRef.current.emit("group-call:join", { groupId: gId })
    },
    [dispatch]
  )

  // ---- Покинуть беседу ----
  const leaveCall = useCallback(() => {
    if (!socketRef.current) return
    if (groupId) {
      socketRef.current.emit("group-call:leave", { groupId })
    }

    // Уничтожаем все peer соединения
    Object.keys(peersRef.current).forEach(destroyPeer)

    // Останавливаем локальный стрим
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null

    dispatch(leaveGroupCall())
  }, [groupId, destroyPeer, dispatch])

  // ---- Мут/анмут микрофона ----
  const handleToggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled
      })
    }
    dispatch(toggleAudio())
  }, [dispatch])

  // ---- Включить/выключить камеру ----
  const handleToggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return

    const videoTracks = localStreamRef.current.getVideoTracks()

    if (videoTracks.length > 0) {
      // Камера уже есть — просто включаем/выключаем
      videoTracks.forEach((t) => {
        t.enabled = !t.enabled
      })
    } else {
      // Камеры нет — запрашиваем и добавляем трек всем peers
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        const videoTrack = videoStream.getVideoTracks()[0]
        localStreamRef.current.addTrack(videoTrack)

        // Добавляем трек всем существующим peer соединениям
        Object.values(peersRef.current).forEach(({ peer }) => {
          peer.addTrack(videoTrack, localStreamRef.current!)
        })
      } catch (err) {
        console.error("Не удалось получить камеру", err)
      }
    }

    dispatch(toggleVideo())
  }, [dispatch])

  return {
    localStream: localStreamRef.current,
    remoteStreams,
    joinCall,
    leaveCall,
    handleToggleAudio,
    handleToggleVideo,
  }
}
