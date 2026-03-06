import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { getSocket } from "@/lib/socket"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setIncomingCall,
  clearIncomingCall,
  acceptCall,
  startCall,
  toggleAudio,
  toggleVideo,
  setReconnecting,
  setReconnected,
} from "@/store/slices/callSlice"
import Peer from "simple-peer"
import type { RootState } from "@/store/store"
import type { Socket } from "socket.io-client"
import type { SignalData } from "simple-peer"
import { getAudioContext } from "@/utils/audioPlayback"

type Maybe<T> = T | null
type HandleReconnectFn = (initiator: boolean, targetSocketId?: string) => void

const MAX_RECONNECT_ATTEMPTS = 2
const RECONNECT_DELAY_MS = 2000

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
]

export const useCall = (userId: string | null) => {
  const [loadingConnect, setLoadingConnect] = useState(false)
  const dispatch = useAppDispatch()
  const { callerId, targetId } = useAppSelector((s: RootState) => s.call)

  const [localStreamState, setLocalStreamState] =
    useState<Maybe<MediaStream>>(null)
  const [remoteStream, setRemoteStream] = useState<Maybe<MediaStream>>(null)

  const peerRef = useRef<Maybe<Peer.Instance>>(null)
  const localStreamRef = useRef<Maybe<MediaStream>>(null)
  const socketRef = useRef<Maybe<Socket>>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const handleReconnectRef = useRef<HandleReconnectFn | null>(null)

  // ---- Получение микрофона ----
  const getOrCreateLocalStream = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true))
      return localStreamRef.current
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        sampleRate: 48000,
        channelCount: 1,
      },
      video: false,
    })

    // Важно: "разбудить" AudioContext тем же жестом пользователя
    // когда он нажал "принять" / "позвонить"
    getAudioContext().resume()

    // stream.getAudioTracks().forEach((t) => (t.enabled = true))
    localStreamRef.current = stream
    setLocalStreamState(stream)
    return stream
  }

  // ---- Очистка ----
  const hardCleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    if (peerRef.current) {
      peerRef.current.removeAllListeners()
      peerRef.current.destroy()
      peerRef.current = null
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }

    reconnectAttemptsRef.current = 0
    setLocalStreamState(null)
    setRemoteStream(null)
    setLoadingConnect(false)
  }, [])

  // ---- Переподключение ----
  const handleReconnect = useCallback(
    (initiator: boolean, targetSocketId?: string) => {
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        endCall()
        return
      }

      reconnectAttemptsRef.current += 1
      dispatch(setReconnecting())

      reconnectTimerRef.current = setTimeout(async () => {
        if (peerRef.current) {
          peerRef.current.removeAllListeners()
          peerRef.current.destroy()
          peerRef.current = null
        }

        const stream = await getOrCreateLocalStream()
        const peer = createPeer(initiator, stream, targetSocketId)

        peer.on("signal", (signal) => {
          const to = targetSocketId ?? callerId ?? targetId
          if (to) socketRef.current?.emit("call:signal", { to, signal })
        })

        peer.on("connect", () => {
          dispatch(setReconnected())
          reconnectAttemptsRef.current = 0
        })
      }, RECONNECT_DELAY_MS)
    },
    [callerId, targetId, dispatch] // eslint-disable-line
  )

  // 2. Обновляй реф при изменении функции
  useEffect(() => {
    handleReconnectRef.current = handleReconnect
  }, [handleReconnect])

  // ---- Создание Peer ----
  const createPeer = useCallback(
    (initiator: boolean, stream: MediaStream, targetSocketId?: string) => {
      if (peerRef.current) return peerRef.current

      const p = new Peer({
        initiator,
        trickle: true,
        // trickle: false,
        stream,
        config: { iceServers: ICE_SERVERS },
      })

      p.on("stream", (remote) => {
        console.log("📹 remote stream tracks:", remote.getTracks())
        setRemoteStream(remote)
      })
      p.on("track", (track, stream) => {
        console.log("📹 new track:", track.kind)
        setRemoteStream(stream)
      })

      p.on("error", (err) => {
        console.error("Peer error", err)
        handleReconnectRef.current?.(initiator, targetSocketId)
        // handleReconnect(initiator, targetSocketId)
      })

      p.on("close", () => {
        // 👇 Вызываем через .current — всегда актуальная версия
        handleReconnectRef.current?.(initiator, targetSocketId)
        // handleReconnect(initiator, targetSocketId)
      })

      peerRef.current = p
      return p
    },
    []
  )

  // ---- beforeunload ----
  useEffect(() => {
    const handleUnload = () => {
      const to = callerId ?? targetId
      if (to) socketRef.current?.emit("call:end", { to })
    }
    window.addEventListener("beforeunload", handleUnload)
    return () => window.removeEventListener("beforeunload", handleUnload)
  }, [callerId, targetId])

  // ---- Socket события ----
  useEffect(() => {
    if (!userId) return
    const token = localStorage.getItem("accessToken")
    if (!token) return

    const s = getSocket(token)
    s.connect()
    socketRef.current = s

    s.on("call:incoming", ({ from, avatar, username }) =>
      dispatch(setIncomingCall({ callerId: from, avatar, username }))
    )

    const onCallAccept = async ({ from }: { from: string }) => {
      const stream = await getOrCreateLocalStream()
      const peer = createPeer(true, stream, from)

      peer.on("signal", (signal) => {
        s.emit("call:signal", { to: from, signal })
      })

      peer.on("connect", () => {
        dispatch(acceptCall())
        setLoadingConnect(false)
      })
    }

    s.on("call:accept", onCallAccept)

    // const onSignal = async ({
    //   from,
    //   signal,
    // }: {
    //   from: string
    //   signal: SignalData
    // }) => {
    //   if (signal.type === "offer") {
    //     if (!peerRef.current) {
    //       const stream = await getOrCreateLocalStream()
    //       const peer = createPeer(false, stream, from)

    //       peer.on("signal", (sig) => {
    //         s.emit("call:signal", { to: from, signal: sig })
    //       })

    //       peer.on("connect", () => dispatch(acceptCall()))
    //       peer.signal(signal)
    //     }
    //   } else if (signal.type === "answer") {
    //     if (peerRef.current) {
    //       peerRef.current.signal(signal)
    //     }
    //   }
    // }
    const onSignal = async ({
      from,
      signal,
    }: {
      from: string
      signal: SignalData
    }) => {
      if (signal.type === "offer") {
        if (!peerRef.current) {
          const stream = await getOrCreateLocalStream()
          const peer = createPeer(false, stream, from)

          peer.on("signal", (sig) => {
            s.emit("call:signal", { to: from, signal: sig })
          })

          peer.on("connect", () => dispatch(acceptCall()))
          peer.signal(signal)
        } else {
          // Peer уже есть — просто сигналим (renegotiation для видео)
          peerRef.current.signal(signal)
        }
      } else if (signal.type === "answer") {
        if (peerRef.current) {
          peerRef.current.signal(signal)
        }
      } else {
        // ICE кандидат — передаём существующему peer
        if (peerRef.current) {
          peerRef.current.signal(signal)
        }
      }
    }

    s.on("call:signal", onSignal)
    s.on("call:end", endCall)

    return () => {
      s.off("call:incoming")
      s.off("call:accept", onCallAccept)
      s.off("call:signal", onSignal)
      s.off("call:end")
    }
  }, [userId]) // eslint-disable-line

  // ---- Начать звонок ----
  const callStart = useCallback(
    async (toId: string, avatar: string, username: string) => {
      dispatch(startCall({ peerId: toId, avatar, username }))
      socketRef.current?.emit("call:start", {
        toUserId: toId,
        fromUserId: userId,
        avatar,
        username,
      })
    },
    [userId, dispatch]
  )

  // ---- Принять звонок ----
  const callAccept = useCallback(() => {
    setLoadingConnect(true)
    socketRef.current?.emit("call:accept", { to: callerId })
  }, [callerId])

  // ---- Завершить звонок ----
  const endCall = useCallback(() => {
    const to = callerId ?? targetId
    if (to) socketRef.current?.emit("call:end", { to })
    hardCleanup()
    dispatch(clearIncomingCall())
  }, [callerId, targetId, hardCleanup, dispatch])

  // ---- Мут микрофона ----
  const handleToggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !t.enabled
      })
    }
    dispatch(toggleAudio())
  }, [dispatch])

  // ---- Видео ----
  const handleToggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return

    const videoTracks = localStreamRef.current.getVideoTracks()

    if (videoTracks.length > 0) {
      videoTracks.forEach((t) => {
        t.enabled = !t.enabled
      })
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        const videoTrack = videoStream.getVideoTracks()[0]
        localStreamRef.current.addTrack(videoTrack)

        if (peerRef.current) {
          peerRef.current.addTrack(videoTrack, localStreamRef.current)
        }

        setLocalStreamState(new MediaStream(localStreamRef.current.getTracks()))
      } catch (err) {
        console.error("Не удалось получить камеру", err)
        return
      }
    }

    dispatch(toggleVideo())
  }, [dispatch])

  // 2. В самом конце хука замени return на:
  return useMemo(
    () => ({
      localStream: localStreamState,
      remoteStream,
      callStart,
      callAccept,
      endCall,
      handleToggleAudio,
      handleToggleVideo,
      loadingConnect,
    }),
    [
      // 👇 Зависимости:
      localStreamState, // если стрим обновился — вернем новый объект (это правильно!)
      remoteStream, // если удаленный стрим изменился — вернем новый объект (правильно!)
      callStart, // уже в useCallback ✅
      callAccept, // уже в useCallback ✅
      endCall, // уже в useCallback ✅
      handleToggleAudio, // уже в useCallback ✅
      handleToggleVideo, // уже в useCallback ✅
      loadingConnect, // примитив, стабильный пока не изменится ✅
    ]
  )

  // return {
  //   localStream: localStreamState,
  //   remoteStream,
  //   callStart,
  //   callAccept,
  //   endCall,
  //   handleToggleAudio,
  //   handleToggleVideo,
  //   loadingConnect,
  // }
}
