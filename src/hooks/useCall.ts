// src/hooks/useCall.ts

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
// import { getSocket } from "@/lib/socket"
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
// import type { Socket } from "socket.io-client"
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
  isFrontCamera,
} from "@/utils/getVideoDevices"
import { useSocket } from "@/providers/SocketProvider"

type Maybe<T> = T | null

const MAX_RECONNECT_ATTEMPTS = 2
const RECONNECT_DELAY_MS = 2000

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
  // const socketRef = useRef<Maybe<Socket>>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const handleReconnectRef = useRef<
    ((initiator: boolean, targetSocketId?: string) => void) | null
  >(null)
  const isCreatingManagerRef = useRef(false)
  const pendingSignalsRef = useRef<
    Array<{
      from: string
      signal: { type: string; payload: SdpData | IceCandidateData }
    }>
  >([])
  const socket = useSocket()
  // console.log("socket", !!socket)

  // ✅ Фикс #3: флаг намеренного завершения звонка
  const intentionalEndRef = useRef(false)

  // // 🔹 В начало хука useCall — отслеживаем состояние сокета
  // useEffect(() => {
  //   console.log("🔌 [DEBUG] Socket state:", {
  //     hasSocket: !!socket,
  //     connected: socket?.connected,
  //     id: socket?.id?.slice(0, 8) + "...",
  //     userId,
  //   })
  // }, [socket, userId])

  // ---- Получение микрофона ----
  const getOrCreateLocalStream = useCallback(async () => {
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
  }, [])

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
    isCreatingManagerRef.current = false
    pendingSignalsRef.current = []

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
        // iceServers: ICE_SERVERS,
        events: {
          // 📡 Отправка сигналов через сокет
          onSignal: ({ type, payload }) => {
            const to = targetSocketId ?? callerId ?? targetId
            // console.log("onSignal to", to)
            // console.log("onSignal socket", socket)
            if (!to || !socket) return

            socket.emit("call:signal", {
              to,
              signal: { type, payload },
            })
          },

          // 🎵 Приём удалённого стрима — аудио через Web Audio, видео через state
          onStream: (incomingStream) => {
            // console.log(
            //   "📥 Remote stream received:",
            //   incomingStream.getTracks(),
            // )

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
            // console.log("✅ Connection established")
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
            // console.log("🔌 PeerConnection closed")
            // ✅ Фикс #3: реконнектим только если это НЕ намеренное завершение
            if (!intentionalEndRef.current) {
              handleReconnectRef.current?.(initiator, targetSocketId)
            }
          },
        },
      })

      return manager
    },
    [callerId, targetId, dispatch, socket],
  )

  // ---- beforeunload ----
  useEffect(() => {
    const handleUnload = () => {
      const to = callerId ?? targetId
      if (to && socket) socket.emit("call:end", { to })
    }
    window.addEventListener("beforeunload", handleUnload)
    return () => window.removeEventListener("beforeunload", handleUnload)
  }, [callerId, targetId, socket])

  // ---- Socket события ----
  useEffect(() => {
    if (!userId || !socket) return
    // const token = localStorage.getItem("accessToken")
    // if (!token) return

    // const s = getSocket(token)
    // const s = getSocket(token)
    // s.connect()
    // socketRef.current = s

    // 📞 Входящий звонок
    // socket.on("call:incoming", ({ from, avatar, username }) =>
    //   dispatch(setIncomingCall({ callerId: from, avatar, username })),
    // )

    const onIncoming = ({
      from,
      avatar,
      username,
    }: {
      from: string
      avatar: string
      username: string
    }) => {
      // console.log("📥 [DEBUG] Received call:incoming:", { from })
      dispatch(setIncomingCall({ callerId: from, avatar, username }))
    }

    // ✅ Фикс callStart: PC создаём здесь — только после того как собеседник принял
    const onCallAccept = async ({ from }: { from: string }) => {
      // console.log("📥 [DEBUG] Received call:accept from:", from)
      const stream = await getOrCreateLocalStream()
      // console.log("🔧 [DEBUG] Creating PeerConnection (initiator: true)")
      const manager = createPeerConnection(true, stream, from)
      managerRef.current = manager
      // console.log(
      //   "✅ [DEBUG] PeerConnection created, waiting for negotiation...",
      // )
    }

    // Заменяй полностью onSignal внутри useEffect
    const onSignal = async ({
      from,
      signal,
    }: {
      from: string
      signal: { type: string; payload: SdpData | IceCandidateData }
    }) => {
      // console.log("📡 [DEBUG] Received signal:", {
      //   from,
      //   type: signal.type,
      //   hasManager: !!managerRef.current,
      //   isCreating: isCreatingManagerRef.current,
      //   signalingState:
      //     managerRef.current?.getPeerConnection?.()?.signalingState,
      // })

      // Если manager уже есть — просто передаём сигнал
      if (managerRef.current) {
        // console.log("⏳ [DEBUG] Handling signal with existing manager...")
        await managerRef.current.handleSignal({
          type: signal.type as "offer" | "answer" | "ice-candidate",
          payload: signal.payload,
        })
        // console.log("✅ [DEBUG] Signal handled")
        return
      }

      // Manager ещё создаётся (offer в процессе) — буферизуем всё кроме offer
      if (isCreatingManagerRef.current) {
        if (signal.type !== "offer") {
          // console.log(
          //   "📦 [DEBUG] Buffering signal while manager is creating:",
          //   signal.type,
          // )
          pendingSignalsRef.current.push({ from, signal })
        }
        return
      }

      // Manager нет и не создаётся
      if (signal.type === "offer") {
        // console.log("🔧 [DEBUG] No manager, creating new one for offer")
        isCreatingManagerRef.current = true

        try {
          const stream = await getOrCreateLocalStream()
          const manager = createPeerConnection(false, stream, from)
          managerRef.current = manager

          // console.log("⏳ [DEBUG] Handling offer...")
          await manager.handleSignal({
            type: "offer",
            payload: signal.payload,
          })
          // console.log("✅ [DEBUG] Offer handled")

          // Применяем все накопившиеся сигналы по порядку
          if (pendingSignalsRef.current.length > 0) {
            // console.log(
            //   `📦 [DEBUG] Applying ${pendingSignalsRef.current.length} buffered signals`,
            // )
            for (const pending of pendingSignalsRef.current) {
              await manager.handleSignal({
                type: pending.signal.type as
                  | "offer"
                  | "answer"
                  | "ice-candidate",
                payload: pending.signal.payload,
              })
            }
            pendingSignalsRef.current = []
          }
        } finally {
          isCreatingManagerRef.current = false
        }
      } else {
        // ice-candidate пришёл раньше offer и manager ещё не создан — буферизуем
        // console.log(
        //   "📦 [DEBUG] Buffering early signal (no manager yet):",
        //   signal.type,
        // )
        pendingSignalsRef.current.push({ from, signal })
      }
    }

    // 🚪 Завершение звонка от собеседника
    const onCallEnd = () => {
      // console.log("📥 [DEBUG] Received call:end")
      endCall()
    }
    socket.on("call:incoming", onIncoming)
    socket.on("call:accept", onCallAccept)
    socket.on("call:signal", onSignal)
    socket.on("call:end", onCallEnd)

    return () => {
      // console.log("🧹 [DEBUG] Cleaning up socket listeners")
      socket.off("call:incoming", onIncoming)
      socket.off("call:accept", onCallAccept)
      socket.off("call:signal", onSignal)
      socket.off("call:end", onCallEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, dispatch, socket, getOrCreateLocalStream])

  // ---- Начать звонок ----
  // ✅ Фикс callStart: только emit, без создания PC
  // PC создаётся в onCallAccept — когда собеседник реально принял
  const callStart = useCallback(
    async (toId: string, avatar: string, username: string) => {
      // console.log("📞 [DEBUG] callStart called:", { toId, userId })

      if (!socket) {
        console.error("❌ [DEBUG] socket is null in callStart")
        return
      }
      // console.log("callStart")

      dispatch(startCall({ peerId: toId, avatar, username }))

      // Получаем микрофон заранее чтобы не было задержки после accept
      await getOrCreateLocalStream()
      // console.log("📤 [DEBUG] Emitting call:start:", { toUserId: toId })
      socket.emit("call:start", {
        toUserId: toId,
        fromUserId: userId,
        avatar,
        username,
      })
    },
    [userId, dispatch, socket],
  )

  // ---- Принять звонок ----
  const callAccept = useCallback(() => {
    if (!socket) {
      console.error("❌ [DEBUG] socket is null in callAccept")
      return
    }

    setLoadingConnect(true)
    // console.log("📤 [DEBUG] Emitting call:accept:", { to: callerId })
    socket.emit("call:accept", { to: callerId })
  }, [callerId, socket])

  // ---- Завершить звонок ----
  const endCall = useCallback(() => {
    if (!socket) return

    const to = callerId ?? targetId
    if (to) socket.emit("call:end", { to })

    dispatch(setCallStatus("ended"))
    hardCleanup()
    dispatch(clearIncomingCall())
  }, [callerId, targetId, hardCleanup, dispatch, socket])

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

  const handleSwitchCamera = useCallback(async () => {
    if (
      videoDevices.length < 2 ||
      !localStreamRef.current ||
      !managerRef.current
    ) {
      console.warn("⚠️ Cannot switch camera: preconditions not met")
      return
    }

    const nextDeviceId = getOppositeCamera(
      videoDeviceIdRef.current || "",
      videoDevices,
    )
    if (!nextDeviceId) return

    videoDeviceIdRef.current = nextDeviceId
    setCurrentVideoDeviceId(nextDeviceId)

    // 🔹 Теперь работает правильно:
    const isFront = isFrontCamera(nextDeviceId, videoDevices)
    // console.log(
    //   `🔄 Switching to ${isFront ? "front" : "back"} camera: ${nextDeviceId.slice(0, 8)}...`,
    // )

    try {
      const pc = managerRef.current.getPeerConnection()

      // 1. Удаляем старые видео-сендеры из PeerConnection
      const videoSenders = pc
        .getSenders()
        .filter((s) => s.track?.kind === "video")
      for (const sender of videoSenders) {
        pc.removeTrack(sender)
      }

      // 2. Останавливаем и удаляем треки из локального стрима
      const oldVideoTracks = localStreamRef.current.getVideoTracks()
      oldVideoTracks.forEach((track) => {
        localStreamRef.current?.removeTrack(track)
        track.stop()
      })

      // 3. Небольшая задержка для стабилизации
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 4. Получаем новый видеострим
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: nextDeviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      const newVideoTrack = newVideoStream.getVideoTracks()[0]

      // 5. Добавляем трек в локальный стрим
      localStreamRef.current.addTrack(newVideoTrack)
      setLocalStreamState(new MediaStream(localStreamRef.current.getTracks()))

      // 6. Добавляем трек в PeerConnection
      managerRef.current.addVideoTrack(newVideoTrack, localStreamRef.current)

      // 7. Ренеготация
      await managerRef.current.renegotiateForVideo()
    } catch (err) {
      console.error("❌ Camera switch failed:", err)

      // Фоллбэк через facingMode
      try {
        const newFacingMode = isFront ? "user" : "environment"

        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: newFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })

        const oldVideoTracks = localStreamRef.current?.getVideoTracks() || []
        oldVideoTracks.forEach((track) => {
          localStreamRef.current?.removeTrack(track)
          track.stop()
        })

        const newVideoTrack = fallbackStream.getVideoTracks()[0]
        localStreamRef.current?.addTrack(newVideoTrack)

        if (managerRef.current) {
          const pc = managerRef.current.getPeerConnection()
          pc.getSenders()
            .filter((s) => s.track?.kind === "video")
            .forEach((s) => pc.removeTrack(s))
          managerRef.current.addVideoTrack(
            newVideoTrack,
            localStreamRef.current!,
          )
          await managerRef.current.renegotiateForVideo()
        }

        setLocalStreamState(
          new MediaStream(localStreamRef.current!.getTracks()),
        )
      } catch (fallbackErr) {
        console.error("❌ Fallback camera switch also failed:", fallbackErr)
      }
    }
  }, [videoDevices])

  // // 🔹 Функция переключения камеры (вызывать ТОЛЬКО после включения видео)
  // const handleSwitchCamera = useCallback(async () => {
  //   if (videoDevices.length < 2) {
  //     console.warn("⚠️ Только одна камера доступна")
  //     return
  //   }

  //   const nextDeviceId = getOppositeCamera(
  //     videoDeviceIdRef.current || "",
  //     videoDevices,
  //   )
  //   if (!nextDeviceId) return

  //   videoDeviceIdRef.current = nextDeviceId
  //   setCurrentVideoDeviceId(nextDeviceId)

  //   // 🔹 Пересоздаём видеострим с новой камерой
  //   if (localStreamRef.current) {
  //     // 1. Удаляем старый видео-трек
  //     const oldVideoTracks = localStreamRef.current.getVideoTracks()
  //     oldVideoTracks.forEach((track) => {
  //       track.stop()
  //       localStreamRef.current?.removeTrack(track)
  //     })

  //     // 2. Получаем новый видеострим с выбранной камерой
  //     // 🔹 Важно: permission уже есть, поэтому запрос не покажется снова!
  //     const newVideoStream = await navigator.mediaDevices.getUserMedia({
  //       video: {
  //         deviceId: { exact: nextDeviceId },
  //         width: { ideal: 1280 },
  //         height: { ideal: 720 },
  //       },
  //     })

  //     const newVideoTrack = newVideoStream.getVideoTracks()[0]
  //     localStreamRef.current.addTrack(newVideoTrack)

  //     // 3. Добавляем трек в PeerConnection
  //     if (managerRef.current) {
  //       managerRef.current.addVideoTrack(newVideoTrack, localStreamRef.current)
  //       // 4. Запускаем ренеготацию
  //       await managerRef.current.renegotiateForVideo()
  //     }

  //     setLocalStreamState(new MediaStream(localStreamRef.current.getTracks()))
  //   }
  // }, [videoDevices])

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
