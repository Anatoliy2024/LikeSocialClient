// src/hooks/useCall.ts

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
  setCallStatus,
} from "@/store/slices/callSlice"
import type { RootState } from "@/store/store"
import type { Socket } from "socket.io-client"
import {
  getAudioContext,
  playRemoteStream,
  stopRemoteStream,
  closeAudioContext,
} from "@/utils/audioPlayback"
import {
  PeerConnectionManager,
  type IceCandidateData,
  type SdpData,
} from "@/lib/webrtc/PeerConnectionManager"
// 🔹 Добавь импорты
import {
  getVideoDevices,
  getOppositeCamera,
  VideoDevice,
} from "@/utils/getVideoDevices"

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

  // 🔹 Добавь состояние для текущей камеры
  const [currentVideoDeviceId, setCurrentVideoDeviceId] = useState<
    string | null
  >(null)
  const [videoDevices, setVideoDevices] = useState<VideoDevice[]>([])
  const videoDeviceIdRef = useRef<string | null>(null)
  const hasRequestedCameraRef = useRef(false)

  const managerRef = useRef<Maybe<PeerConnectionManager>>(null)
  const localStreamRef = useRef<Maybe<MediaStream>>(null)
  const socketRef = useRef<Maybe<Socket>>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const handleReconnectRef = useRef<
    ((initiator: boolean, targetSocketId?: string) => void) | null
  >(null)

  // ✅ Фикс #3: флаг намеренного завершения звонка
  const intentionalEndRef = useRef(false)

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

    getAudioContext()
      .resume()
      .catch(() => {})

    localStreamRef.current = stream
    setLocalStreamState(stream)
    return stream
  }

  // ---- Очистка ----
  const hardCleanup = useCallback(() => {
    // ✅ Фикс #3: помечаем как намеренное завершение ДО закрытия менеджера,
    // чтобы onClose не запустил реконнект
    intentionalEndRef.current = true

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    if (managerRef.current) {
      managerRef.current.close(true)
      managerRef.current = null
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }

    stopRemoteStream()
    closeAudioContext()

    reconnectAttemptsRef.current = 0
    intentionalEndRef.current = false // сбрасываем для следующего звонка
    setLocalStreamState(null)
    setRemoteStream(null)
    setLoadingConnect(false)

    // 🔹 Сбросить состояния камер
    setVideoDevices([])
    setCurrentVideoDeviceId(null)
    videoDeviceIdRef.current = null
    hasRequestedCameraRef.current = false
  }, [])

  // ---- Переподключение ----
  const handleReconnect = useCallback(
    (initiator: boolean, targetSocketId?: string) => {
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        dispatch(setCallStatus("failed"))
        // endCall вызовет hardCleanup → не рекурсируем, просто чистим
        hardCleanup()
        dispatch(clearIncomingCall())
        return
      }

      reconnectAttemptsRef.current += 1
      dispatch(setReconnecting())

      reconnectTimerRef.current = setTimeout(async () => {
        if (managerRef.current) {
          managerRef.current.close(true)
          managerRef.current = null
        }

        const stream = await getOrCreateLocalStream()
        const manager = createPeerConnection(initiator, stream, targetSocketId)
        managerRef.current = manager
      }, RECONNECT_DELAY_MS)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, hardCleanup],
  )

  // Обновляем реф при изменении функции
  useEffect(() => {
    handleReconnectRef.current = handleReconnect
  }, [handleReconnect])

  // ---- Создание PeerConnectionManager ----
  const createPeerConnection = useCallback(
    (
      initiator: boolean,
      stream: MediaStream,
      targetSocketId?: string,
    ): PeerConnectionManager => {
      // ✅ Фикс #4: не возвращаем существующий менеджер если он уже закрыт
      if (managerRef.current && !managerRef.current.getIsClosed()) {
        return managerRef.current
      }

      // Сбрасываем флаг перед новым соединением
      intentionalEndRef.current = false

      const manager = new PeerConnectionManager({
        initiator,
        remoteUserId: targetId || callerId || "",
        remoteSocketId: targetSocketId || "",
        localStream: stream,
        iceServers: ICE_SERVERS,
        events: {
          // 📡 Отправка сигналов через сокет
          onSignal: ({ type, payload }) => {
            const to = targetSocketId ?? callerId ?? targetId
            if (!to || !socketRef.current) return

            socketRef.current.emit("call:signal", {
              to,
              signal: { type, payload },
            })
          },

          // 🎵 Приём удалённого стрима — аудио через Web Audio, видео через state
          onStream: (incomingStream) => {
            console.log(
              "📥 Remote stream received:",
              incomingStream.getTracks(),
            )

            // Аудио треки → Web Audio цепочка (фильтры + gain)
            const audioTracks = incomingStream.getAudioTracks()
            if (audioTracks.length > 0) {
              playRemoteStream(incomingStream)
            }

            // Видео треки → state для рендера в <video>
            const videoTracks = incomingStream.getVideoTracks()
            if (videoTracks.length > 0) {
              setRemoteStream(incomingStream)
            } else {
              // Только аудио — стрим в state не нужен для видео,
              // но сохраняем чтобы hasRemoteVideo оставался false
              setRemoteStream(incomingStream)
            }
          },

          // 🟢 Соединение установлено
          onConnected: () => {
            console.log("✅ Connection established")
            dispatch(acceptCall())
            setLoadingConnect(false)
            if (reconnectAttemptsRef.current > 0) {
              dispatch(setReconnected())
              reconnectAttemptsRef.current = 0
            }
          },

          // ❌ Ошибки
          onError: (err) => {
            console.error("🔥 PeerConnection error:", err)
            if (!intentionalEndRef.current) {
              dispatch(setCallStatus("failed"))
              handleReconnectRef.current?.(initiator, targetSocketId)
            }
          },

          // 🚪 Закрытие
          onClose: () => {
            console.log("🔌 PeerConnection closed")
            // ✅ Фикс #3: реконнектим только если это НЕ намеренное завершение
            if (!intentionalEndRef.current) {
              handleReconnectRef.current?.(initiator, targetSocketId)
            }
          },
        },
      })

      return manager
    },
    [callerId, targetId, dispatch],
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

    // 📞 Входящий звонок
    s.on("call:incoming", ({ from, avatar, username }) =>
      dispatch(setIncomingCall({ callerId: from, avatar, username })),
    )

    // ✅ Фикс callStart: PC создаём здесь — только после того как собеседник принял
    const onCallAccept = async ({ from }: { from: string }) => {
      const stream = await getOrCreateLocalStream()
      const manager = createPeerConnection(true, stream, from)
      managerRef.current = manager
    }

    // 📡 Обработка сигналов (offer/answer/ice)
    const onSignal = async ({
      from,
      signal,
    }: {
      from: string
      signal: { type: string; payload: SdpData | IceCandidateData }
    }) => {
      if (!managerRef.current) {
        if (signal.type === "offer") {
          const stream = await getOrCreateLocalStream()
          const manager = createPeerConnection(false, stream, from)
          managerRef.current = manager
          await manager.handleSignal({
            type: "offer",
            payload: signal.payload,
          })
        }
      } else {
        await managerRef.current.handleSignal({
          type: signal.type as "offer" | "answer" | "ice-candidate",
          payload: signal.payload,
        })
      }
    }

    // 🚪 Завершение звонка от собеседника
    const onCallEnd = () => {
      endCall()
    }

    s.on("call:accept", onCallAccept)
    s.on("call:signal", onSignal)
    s.on("call:end", onCallEnd)

    return () => {
      s.off("call:incoming")
      s.off("call:accept", onCallAccept)
      s.off("call:signal", onSignal)
      s.off("call:end", onCallEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, createPeerConnection, dispatch])

  // ---- Начать звонок ----
  // ✅ Фикс callStart: только emit, без создания PC
  // PC создаётся в onCallAccept — когда собеседник реально принял
  const callStart = useCallback(
    async (toId: string, avatar: string, username: string) => {
      dispatch(startCall({ peerId: toId, avatar, username }))

      // Получаем микрофон заранее чтобы не было задержки после accept
      await getOrCreateLocalStream()

      socketRef.current?.emit("call:start", {
        toUserId: toId,
        fromUserId: userId,
        avatar,
        username,
      })
    },
    [userId, dispatch],
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

    dispatch(setCallStatus("ended"))
    hardCleanup()
    dispatch(clearIncomingCall())
  }, [callerId, targetId, hardCleanup, dispatch])

  // ---- Мут микрофона ----
  const handleToggleAudio = useCallback(() => {
    if (managerRef.current) {
      const current =
        localStreamRef.current?.getAudioTracks()[0]?.enabled ?? true
      managerRef.current.toggleLocalAudio(!current)
    }
    dispatch(toggleAudio())
  }, [dispatch])

  // ---- Видео ----
  const handleToggleVideo = useCallback(async () => {
    if (!localStreamRef.current) return

    const videoTracks = localStreamRef.current.getVideoTracks()

    if (videoTracks.length > 0) {
      // Переключаем существующий трек
      videoTracks.forEach((t) => {
        t.enabled = !t.enabled
      })
    } else {
      // Добавляем новый видео-трек
      try {
        const videoStream = await navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: { exact: "user" },
              width: { ideal: 640 },
              height: { ideal: 360 },
            },
          })
          .catch(async (err) => {
            // 🔹 Фоллбэк: если exact не сработал — пробуем обычный режим
            console.warn(
              "⚠️ facingMode: exact не сработал, пробуем обычный режим",
              err,
            )
            return await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 360 },
              },
            })
          })
        const videoTrack = videoStream.getVideoTracks()[0]
        localStreamRef.current.addTrack(videoTrack)

        // Добавляем трек в PeerConnection
        if (managerRef.current) {
          managerRef.current.addVideoTrack(videoTrack, localStreamRef.current!)

          // 🔹 Запускаем ренеготацию для видео
          await managerRef.current.renegotiateForVideo()
        }

        // if (managerRef.current) {
        //   managerRef.current.addVideoTrack(videoTrack, localStreamRef.current!)
        // }

        setLocalStreamState(new MediaStream(localStreamRef.current.getTracks()))

        // 🔹 Ключевое: после первого успешного запроса камеры — загружаем список устройств
        hasRequestedCameraRef.current = true
        await loadVideoDevices() // ← Теперь enumerateDevices вернёт нормальные label!
      } catch (err) {
        console.error("❌ Не удалось получить камеру", err)
        return
      }
    }

    dispatch(toggleVideo())
  }, [dispatch])

  // 🔹 Функция получения списка камер (вызывать ТОЛЬКО после разрешения камеры)
  const loadVideoDevices = useCallback(async () => {
    // 🔹 Важно: enumerateDevices вернёт пустые label, если нет разрешения на камеру
    const devices = await getVideoDevices()
    setVideoDevices(devices)

    if (devices.length > 0 && !videoDeviceIdRef.current) {
      videoDeviceIdRef.current = devices[0].deviceId
      setCurrentVideoDeviceId(devices[0].deviceId)
    }
  }, [])

  // 🔹 Функция переключения камеры (вызывать ТОЛЬКО после включения видео)
  const handleSwitchCamera = useCallback(async () => {
    if (videoDevices.length < 2) {
      console.warn("⚠️ Только одна камера доступна")
      return
    }

    const nextDeviceId = getOppositeCamera(
      videoDeviceIdRef.current || "",
      videoDevices,
    )
    if (!nextDeviceId) return

    videoDeviceIdRef.current = nextDeviceId
    setCurrentVideoDeviceId(nextDeviceId)

    // 🔹 Пересоздаём видеострим с новой камерой
    if (localStreamRef.current) {
      // 1. Удаляем старый видео-трек
      const oldVideoTracks = localStreamRef.current.getVideoTracks()
      oldVideoTracks.forEach((track) => {
        track.stop()
        localStreamRef.current?.removeTrack(track)
      })

      // 2. Получаем новый видеострим с выбранной камерой
      // 🔹 Важно: permission уже есть, поэтому запрос не покажется снова!
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: nextDeviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      const newVideoTrack = newVideoStream.getVideoTracks()[0]
      localStreamRef.current.addTrack(newVideoTrack)

      // 3. Добавляем трек в PeerConnection
      if (managerRef.current) {
        managerRef.current.addVideoTrack(newVideoTrack, localStreamRef.current)
        // 4. Запускаем ренеготацию
        await managerRef.current.renegotiateForVideo()
      }

      setLocalStreamState(new MediaStream(localStreamRef.current.getTracks()))
    }
  }, [videoDevices])

  useEffect(() => {
    if (hasRequestedCameraRef.current) {
      loadVideoDevices()
    }
  }, [hasRequestedCameraRef.current, loadVideoDevices])

  // ---- Публичный API ----
  return useMemo(
    () => ({
      localStream: localStreamState,
      remoteStream,
      callStart,
      callAccept,
      endCall,
      handleToggleAudio,
      handleToggleVideo,
      handleSwitchCamera, // ← Новая функция
      videoDevices, // ← Список камер
      currentVideoDeviceId, // ← Текущая камера
      loadingConnect,
    }),
    [
      localStreamState,
      remoteStream,
      callStart,
      callAccept,
      endCall,
      handleToggleAudio,
      handleToggleVideo,
      handleSwitchCamera, // ← Новая функция
      videoDevices, // ← Список камер
      currentVideoDeviceId, // ← Текущая камера
      loadingConnect,
    ],
  )
}

// import { useEffect, useRef, useState, useCallback, useMemo } from "react"
// import { getSocket } from "@/lib/socket"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import {
//   setIncomingCall,
//   clearIncomingCall,
//   acceptCall,
//   startCall,
//   toggleAudio,
//   toggleVideo,
//   setReconnecting,
//   setReconnected,
// } from "@/store/slices/callSlice"
// import Peer from "simple-peer"
// import type { RootState } from "@/store/store"
// import type { Socket } from "socket.io-client"
// import type { SignalData } from "simple-peer"
// import { getAudioContext } from "@/utils/audioPlayback"

// type Maybe<T> = T | null
// type HandleReconnectFn = (initiator: boolean, targetSocketId?: string) => void

// const MAX_RECONNECT_ATTEMPTS = 2
// const RECONNECT_DELAY_MS = 2000

// const ICE_SERVERS = [
//   { urls: "stun:stun.l.google.com:19302" },
//   { urls: "stun:stun1.l.google.com:19302" },
// ]

// export const useCall = (userId: string | null) => {
//   const [loadingConnect, setLoadingConnect] = useState(false)
//   const dispatch = useAppDispatch()
//   const { callerId, targetId } = useAppSelector((s: RootState) => s.call)

//   const [localStreamState, setLocalStreamState] =
//     useState<Maybe<MediaStream>>(null)
//   const [remoteStream, setRemoteStream] = useState<Maybe<MediaStream>>(null)

//   const peerRef = useRef<Maybe<Peer.Instance>>(null)
//   const localStreamRef = useRef<Maybe<MediaStream>>(null)
//   const socketRef = useRef<Maybe<Socket>>(null)
//   const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
//   const reconnectAttemptsRef = useRef(0)
//   const handleReconnectRef = useRef<HandleReconnectFn | null>(null)

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
//         autoGainControl: false,
//         sampleRate: 48000,
//         channelCount: 1,
//       },
//       video: false,
//     })

//     // Важно: "разбудить" AudioContext тем же жестом пользователя
//     // когда он нажал "принять" / "позвонить"
//     getAudioContext().resume()

//     // stream.getAudioTracks().forEach((t) => (t.enabled = true))
//     localStreamRef.current = stream
//     setLocalStreamState(stream)
//     return stream
//   }

//   // ---- Очистка ----
//   const hardCleanup = useCallback(() => {
//     if (reconnectTimerRef.current) {
//       clearTimeout(reconnectTimerRef.current)
//       reconnectTimerRef.current = null
//     }

//     if (peerRef.current) {
//       peerRef.current.removeAllListeners()
//       peerRef.current.destroy()
//       peerRef.current = null
//     }

//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((t) => t.stop())
//       localStreamRef.current = null
//     }

//     reconnectAttemptsRef.current = 0
//     setLocalStreamState(null)
//     setRemoteStream(null)
//     setLoadingConnect(false)
//   }, [])

//   // ---- Переподключение ----
//   const handleReconnect = useCallback(
//     (initiator: boolean, targetSocketId?: string) => {
//       if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
//         endCall()
//         return
//       }

//       reconnectAttemptsRef.current += 1
//       dispatch(setReconnecting())

//       reconnectTimerRef.current = setTimeout(async () => {
//         if (peerRef.current) {
//           peerRef.current.removeAllListeners()
//           peerRef.current.destroy()
//           peerRef.current = null
//         }

//         const stream = await getOrCreateLocalStream()
//         const peer = createPeer(initiator, stream, targetSocketId)

//         peer.on("signal", (signal) => {
//           const to = targetSocketId ?? callerId ?? targetId
//           if (to) socketRef.current?.emit("call:signal", { to, signal })
//         })

//         peer.on("connect", () => {
//           dispatch(setReconnected())
//           reconnectAttemptsRef.current = 0
//         })
//       }, RECONNECT_DELAY_MS)
//     },
//     [callerId, targetId, dispatch] // eslint-disable-line
//   )

//   // 2. Обновляй реф при изменении функции
//   useEffect(() => {
//     handleReconnectRef.current = handleReconnect
//   }, [handleReconnect])

//   // ---- Создание Peer ----
//   const createPeer = useCallback(
//     (initiator: boolean, stream: MediaStream, targetSocketId?: string) => {
//       if (peerRef.current) return peerRef.current

//       const p = new Peer({
//         initiator,
//         trickle: true,
//         // trickle: false,
//         stream,
//         config: { iceServers: ICE_SERVERS },
//       })

//       p.on("stream", (remote) => {
//         console.log("📹 remote stream tracks:", remote.getTracks())
//         setRemoteStream(remote)
//       })
//       p.on("track", (track, stream) => {
//         console.log("📹 new track:", track.kind)
//         setRemoteStream(stream)
//       })

//       p.on("error", (err) => {
//         console.error("Peer error", err)
//         handleReconnectRef.current?.(initiator, targetSocketId)
//         // handleReconnect(initiator, targetSocketId)
//       })

//       p.on("close", () => {
//         // 👇 Вызываем через .current — всегда актуальная версия
//         handleReconnectRef.current?.(initiator, targetSocketId)
//         // handleReconnect(initiator, targetSocketId)
//       })

//       peerRef.current = p
//       return p
//     },
//     []
//   )

//   // ---- beforeunload ----
//   useEffect(() => {
//     const handleUnload = () => {
//       const to = callerId ?? targetId
//       if (to) socketRef.current?.emit("call:end", { to })
//     }
//     window.addEventListener("beforeunload", handleUnload)
//     return () => window.removeEventListener("beforeunload", handleUnload)
//   }, [callerId, targetId])

//   // ---- Socket события ----
//   useEffect(() => {
//     if (!userId) return
//     const token = localStorage.getItem("accessToken")
//     if (!token) return

//     const s = getSocket(token)
//     s.connect()
//     socketRef.current = s

//     s.on("call:incoming", ({ from, avatar, username }) =>
//       dispatch(setIncomingCall({ callerId: from, avatar, username }))
//     )

//     const onCallAccept = async ({ from }: { from: string }) => {
//       const stream = await getOrCreateLocalStream()
//       const peer = createPeer(true, stream, from)

//       peer.on("signal", (signal) => {
//         s.emit("call:signal", { to: from, signal })
//       })

//       peer.on("connect", () => {
//         dispatch(acceptCall())
//         setLoadingConnect(false)
//       })
//     }

//     s.on("call:accept", onCallAccept)

//     // const onSignal = async ({
//     //   from,
//     //   signal,
//     // }: {
//     //   from: string
//     //   signal: SignalData
//     // }) => {
//     //   if (signal.type === "offer") {
//     //     if (!peerRef.current) {
//     //       const stream = await getOrCreateLocalStream()
//     //       const peer = createPeer(false, stream, from)

//     //       peer.on("signal", (sig) => {
//     //         s.emit("call:signal", { to: from, signal: sig })
//     //       })

//     //       peer.on("connect", () => dispatch(acceptCall()))
//     //       peer.signal(signal)
//     //     }
//     //   } else if (signal.type === "answer") {
//     //     if (peerRef.current) {
//     //       peerRef.current.signal(signal)
//     //     }
//     //   }
//     // }
//     const onSignal = async ({
//       from,
//       signal,
//     }: {
//       from: string
//       signal: SignalData
//     }) => {
//       if (signal.type === "offer") {
//         if (!peerRef.current) {
//           const stream = await getOrCreateLocalStream()
//           const peer = createPeer(false, stream, from)

//           peer.on("signal", (sig) => {
//             s.emit("call:signal", { to: from, signal: sig })
//           })

//           peer.on("connect", () => dispatch(acceptCall()))
//           peer.signal(signal)
//         } else {
//           // Peer уже есть — просто сигналим (renegotiation для видео)
//           peerRef.current.signal(signal)
//         }
//       } else if (signal.type === "answer") {
//         if (peerRef.current) {
//           peerRef.current.signal(signal)
//         }
//       } else {
//         // ICE кандидат — передаём существующему peer
//         if (peerRef.current) {
//           peerRef.current.signal(signal)
//         }
//       }
//     }

//     s.on("call:signal", onSignal)
//     s.on("call:end", endCall)

//     return () => {
//       s.off("call:incoming")
//       s.off("call:accept", onCallAccept)
//       s.off("call:signal", onSignal)
//       s.off("call:end")
//     }
//   }, [userId]) // eslint-disable-line

//   // ---- Начать звонок ----
//   const callStart = useCallback(
//     async (toId: string, avatar: string, username: string) => {
//       dispatch(startCall({ peerId: toId, avatar, username }))
//       socketRef.current?.emit("call:start", {
//         toUserId: toId,
//         fromUserId: userId,
//         avatar,
//         username,
//       })
//     },
//     [userId, dispatch]
//   )

//   // ---- Принять звонок ----
//   const callAccept = useCallback(() => {
//     setLoadingConnect(true)
//     socketRef.current?.emit("call:accept", { to: callerId })
//   }, [callerId])

//   // ---- Завершить звонок ----
//   const endCall = useCallback(() => {
//     const to = callerId ?? targetId
//     if (to) socketRef.current?.emit("call:end", { to })
//     hardCleanup()
//     dispatch(clearIncomingCall())
//   }, [callerId, targetId, hardCleanup, dispatch])

//   // ---- Мут микрофона ----
//   const handleToggleAudio = useCallback(() => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getAudioTracks().forEach((t) => {
//         t.enabled = !t.enabled
//       })
//     }
//     dispatch(toggleAudio())
//   }, [dispatch])

//   // ---- Видео ----
//   const handleToggleVideo = useCallback(async () => {
//     if (!localStreamRef.current) return

//     const videoTracks = localStreamRef.current.getVideoTracks()

//     if (videoTracks.length > 0) {
//       videoTracks.forEach((t) => {
//         t.enabled = !t.enabled
//       })
//     } else {
//       try {
//         const videoStream = await navigator.mediaDevices.getUserMedia({
//           video: { width: { ideal: 1280 }, height: { ideal: 720 } },
//         })
//         const videoTrack = videoStream.getVideoTracks()[0]
//         localStreamRef.current.addTrack(videoTrack)

//         if (peerRef.current) {
//           peerRef.current.addTrack(videoTrack, localStreamRef.current)
//         }

//         setLocalStreamState(new MediaStream(localStreamRef.current.getTracks()))
//       } catch (err) {
//         console.error("Не удалось получить камеру", err)
//         return
//       }
//     }

//     dispatch(toggleVideo())
//   }, [dispatch])

//   // 2. В самом конце хука замени return на:
//   return useMemo(
//     () => ({
//       localStream: localStreamState,
//       remoteStream,
//       callStart,
//       callAccept,
//       endCall,
//       handleToggleAudio,
//       handleToggleVideo,
//       loadingConnect,
//     }),
//     [
//       // 👇 Зависимости:
//       localStreamState, // если стрим обновился — вернем новый объект (это правильно!)
//       remoteStream, // если удаленный стрим изменился — вернем новый объект (правильно!)
//       callStart, // уже в useCallback ✅
//       callAccept, // уже в useCallback ✅
//       endCall, // уже в useCallback ✅
//       handleToggleAudio, // уже в useCallback ✅
//       handleToggleVideo, // уже в useCallback ✅
//       loadingConnect, // примитив, стабильный пока не изменится ✅
//     ]
//   )

//   // return {
//   //   localStream: localStreamState,
//   //   remoteStream,
//   //   callStart,
//   //   callAccept,
//   //   endCall,
//   //   handleToggleAudio,
//   //   handleToggleVideo,
//   //   loadingConnect,
//   // }
// }
