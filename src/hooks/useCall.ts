import { useEffect, useRef, useState, useCallback } from "react"
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
        autoGainControl: true,
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
        handleReconnect(initiator, targetSocketId)
      })

      p.on("close", () => {
        handleReconnect(initiator, targetSocketId)
      })

      peerRef.current = p
      return p
    },
    [] // eslint-disable-line
  )

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
    [callerId, targetId, dispatch, createPeer] // eslint-disable-line
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

  return {
    localStream: localStreamState,
    remoteStream,
    callStart,
    callAccept,
    endCall,
    handleToggleAudio,
    handleToggleVideo,
    loadingConnect,
  }
}

// import { useEffect, useRef, useState } from "react"
// import { getSocket } from "@/lib/socket"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import {
//   setIncomingCall,
//   clearIncomingCall,
//   acceptCall,
//   startCall,
// } from "@/store/slices/callSlice"
// import Peer from "simple-peer"
// import type { RootState } from "@/store/store"
// import type { Socket } from "socket.io-client"
// import type { SignalData } from "simple-peer"
// type Maybe<T> = T | null

// export const useCall = (userId: string | null) => {
//   const [loadingConnect, setLoadingConnect] = useState(false)
//   console.log("useCall init", userId)
//   const dispatch = useAppDispatch()
//   const { callerId, targetId } = useAppSelector((s: RootState) => s.call)

//   const [socket, setSocket] = useState<Maybe<Socket>>(null)
//   const [localStreamState, setLocalStreamState] =
//     useState<Maybe<MediaStream>>(null)
//   const [remoteStream, setRemoteStream] = useState<Maybe<MediaStream>>(null)

//   const peerRef = useRef<Maybe<Peer.Instance>>(null)

//   const localStreamRef = useRef<Maybe<MediaStream>>(null)

//   // const audioContextRef = useRef<AudioContext | null>(null)
//   // ---- Получение микрофона ----
//   const getOrCreateLocalStream = async () => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true))
//       return localStreamRef.current
//     }
//     const stream = await navigator.mediaDevices.getUserMedia({
//       audio: {
//         echoCancellation: true,
//         noiseSuppression: true,
//         autoGainControl: true,
//         sampleRate: 48000,
//         channelCount: 1,
//       },
//     })

//     // Проверка
//     const audioTrack = stream.getAudioTracks()[0]
//     const settings = audioTrack.getSettings()
//     console.log("🎤 Echo cancellation:", settings.echoCancellation) // должно быть true
//     console.log("🎤 Noise suppression:", settings.noiseSuppression) // должно быть true

//     // Проверяем возможности
//     const capabilities = audioTrack.getCapabilities?.()
//     console.group("🎤 Audio Track Diagnostics")
//     console.log("Echo cancellation supported:", capabilities?.echoCancellation)
//     console.log(
//       "Echo cancellation active:",
//       audioTrack.getSettings().echoCancellation
//     )
//     console.log("Noise suppression:", audioTrack.getSettings().noiseSuppression)
//     console.log("Sample rate:", audioTrack.getSettings().sampleRate)
//     console.groupEnd()

//     stream.getAudioTracks().forEach((t) => (t.enabled = true))
//     localStreamRef.current = stream
//     setLocalStreamState(stream)
//     return stream
//   }

//   // тестовая модификация звука
//   // const getOrCreateLocalStream = async () => {
//   //   if (localStreamRef.current && audioContextRef.current) {
//   //     localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true))
//   //     return localStreamRef.current
//   //   }

//   //   const rawStream = await navigator.mediaDevices.getUserMedia({
//   //     audio: {
//   //       echoCancellation: true,
//   //       noiseSuppression: true,
//   //       autoGainControl: true,
//   //       sampleRate: 48000,
//   //       channelCount: 1,
//   //     },
//   //   })

//   //   // Создаём аудиоконтекст
//   //   const audioContext = new AudioContext({ sampleRate: 48000 })
//   //   audioContextRef.current = audioContext // сохраняем отдельно
//   //   const source = audioContext.createMediaStreamSource(rawStream)
//   //   const destination = audioContext.createMediaStreamDestination()

//   //   // 1. Highpass фильтр - убирает низкочастотный гул и шум
//   //   const highpass = audioContext.createBiquadFilter()
//   //   highpass.type = "highpass"
//   //   highpass.frequency.value = 80 // убирает гул ниже 80Hz
//   //   highpass.Q.value = 0.7

//   //   // 2. Lowpass фильтр - убирает высокочастотный шум
//   //   const lowpass = audioContext.createBiquadFilter()
//   //   lowpass.type = "lowpass"
//   //   lowpass.frequency.value = 8000 // голос обычно до 4kHz, оставляем запас
//   //   lowpass.Q.value = 0.7

//   //   // 3. Компрессор - выравнивает громкость голоса
//   //   const compressor = audioContext.createDynamicsCompressor()
//   //   compressor.threshold.value = -30 // начинаем сжимать от -30dB
//   //   compressor.knee.value = 20
//   //   compressor.ratio.value = 8 // сжатие 8:1
//   //   compressor.attack.value = 0.003 // быстрая атака (3ms)
//   //   compressor.release.value = 0.15 // средний релиз (150ms)

//   //   // 4. Gain - регулируем итоговую громкость
//   //   const gainNode = audioContext.createGain()
//   //   gainNode.gain.value = 1.2 // усиливаем на 20%

//   //   // Соединяем цепочку
//   //   source.connect(highpass)
//   //   highpass.connect(lowpass)
//   //   lowpass.connect(compressor)
//   //   compressor.connect(gainNode)
//   //   gainNode.connect(destination)

//   //   const processedStream = destination.stream

//   //   // Важно: сохраняем audioContext для очистки
//   //   // ;(processedStream as any)._audioContext = audioContext

//   //   localStreamRef.current = processedStream
//   //   setLocalStreamState(processedStream)
//   //   return processedStream
//   // }

//   // ---- Очистка всего ----
//   // const hardCleanup = () => {
//   //   try {
//   //     peerRef.current?.destroy()
//   //   } catch {}
//   //   peerRef.current = null
//   //   if (localStreamRef.current) {
//   //     localStreamRef.current.getTracks().forEach((t) => t.stop())
//   //   }
//   //   localStreamRef.current = null
//   //   setLocalStreamState(null)
//   //   setRemoteStream(null)
//   //   setLoadingConnect(false)

//   // }

//   // обновили hardCleanup
//   const hardCleanup = () => {
//     // try {
//     //   peerRef.current?.destroy()
//     // } catch {}
//     // peerRef.current = null
//     if (peerRef.current) {
//       peerRef.current.removeAllListeners()
//       peerRef.current.destroy()
//       peerRef.current = null
//     }

//     // Закрываем audioContext ПЕРЕД остановкой треков
//     // if (audioContextRef.current) {
//     //   audioContextRef.current.close()
//     //   audioContextRef.current = null
//     // }

//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((t) => t.stop())
//       localStreamRef.current = null
//     }

//     setLocalStreamState(null)
//     setRemoteStream(null)
//     setLoadingConnect(false)
//   }
//   // ---- Создание Peer ----
//   const createPeer = (initiator: boolean, stream: MediaStream) => {
//     if (peerRef.current) return peerRef.current

//     const p = new Peer({
//       initiator,
//       trickle: false,
//       stream,
//       config: {
//         iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//       },
//     })

//     p.on("stream", (remote) => {
//       console.log("stream", remote)
//       setRemoteStream(remote)
//     })
//     p.on("error", console.error)
//     p.on("close", endCall)

//     peerRef.current = p
//     return p
//   }

//   // ---- Socket.io события ----
//   useEffect(() => {
//     if (!userId) return
//     const token = localStorage.getItem("accessToken")
//     if (!token) return

//     const s = getSocket(token)
//     s.connect()
//     setSocket(s)

//     s.on("call:incoming", ({ from, avatar, username }) =>
//       dispatch(setIncomingCall({ callerId: from, avatar, username }))
//     )

//     s.on("call:accept", async ({ from }) => {
//       console.log("Принял call:accept")
//       const stream = await getOrCreateLocalStream()
//       const peer = createPeer(true, stream)

//       peer.on("signal", (signal) => {
//         console.log("callee generated callStart", signal)
//         console.log("from", from)
//         s?.emit("call:signal", { to: from, signal })
//       })
//       const onConnect = () => {
//         dispatch(acceptCall())
//         setLoadingConnect(false)
//       }
//       peer.on("connect", onConnect)
//     })

//     const onSignal = async ({
//       from,
//       signal,
//     }: {
//       from: string
//       signal: SignalData
//     }) => {
//       console.log("signal handled in hook instance", userId)
//       console.log("peerRef.current***", peerRef.current)

//       if (signal.type === "offer") {
//         if (!peerRef.current) {
//           console.log("Incoming offer, show accept UI")

//           const stream = await getOrCreateLocalStream()
//           const peer = createPeer(false, stream)

//           peer.on("signal", (signal) => {
//             console.log("callee generated callAccept", signal)

//             s?.emit("call:signal", { to: from, signal })
//           })
//           const onConnect = () => dispatch(acceptCall())
//           peer.on("connect", onConnect)

//           peer.signal(signal)
//         }
//       } else if (signal.type === "answer") {
//         if (peerRef.current) {
//           console.log("Applying answer")
//           peerRef.current.signal(signal)
//         }
//       }
//     }

//     s.on("call:signal", onSignal)

//     s.on("call:end", endCall)

//     return () => {
//       s.off("call:incoming")
//       // s.off("call:accept")
//       s.off("call:signal", onSignal)
//       s.off("call:end")
//     }
//   }, [userId])

//   const callStart = async (toId: string, avatar: string, username: string) => {
//     dispatch(startCall({ peerId: toId }))

//     socket?.emit("call:start", {
//       toUserId: toId,
//       fromUserId: userId,
//       avatar,
//       username,
//     })
//   }

//   const callAccept = async () => {
//     setLoadingConnect(true)
//     socket?.emit("call:accept", { to: callerId })
//     console.log("Нажал принять")
//   }

//   const endCall = () => {
//     console.trace("endCall was called from here!")
//     console.log("hardCleanup called, destroying peer", peerRef.current)

//     const to = callerId ?? targetId
//     if (to) socket?.emit("call:end", { to })
//     if (peerRef.current) {
//       hardCleanup()
//     }
//     dispatch(clearIncomingCall())
//   }

//   return {
//     localStream: localStreamState,
//     remoteStream,
//     callStart,
//     callAccept,
//     endCall,
//     loadingConnect,
//   }
// }
