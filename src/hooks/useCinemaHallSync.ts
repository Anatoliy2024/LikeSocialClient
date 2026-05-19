import { useCallback, useEffect, useRef } from "react"
import { useSocket } from "@/providers/SocketProvider"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import {
  applyPlay,
  applyPause,
  applySeek,
  applyWaitingFor,
  setCinemaHall,
  removeParticipant,
} from "@/store/slices/cinemaHallSlice"
import { TorrentInstance } from "@/types/webtorrent.types"
import {
  CinemaHallTargetType,
  ParticipantsType,
} from "@/types/cinemaHall.types"

interface UseCinemaHallSyncProps {
  cinemaHallId: string
  groupId: string
  videoRef: React.RefObject<HTMLVideoElement | null>
  torrentRef?: React.RefObject<TorrentInstance | null>
}

interface PlayData {
  currentTime: number
  playbackUpdatedAt: number
  seqNum: number
}

export function useCinemaHallSync({
  cinemaHallId,
  groupId,
  videoRef,
  torrentRef,
}: UseCinemaHallSyncProps) {
  const socket = useSocket()
  const dispatch = useAppDispatch()

  const { seqNum, currentTime, playing, playbackUpdatedAt } = useAppSelector(
    (state: RootState) => state.cinemaHall.cinemaHallTarget,
  )

  // --- Рефы ---
  const seqNumRef = useRef(seqNum)
  const playbackUpdatedAtRef = useRef(playbackUpdatedAt)
  const currentTimeRef = useRef(currentTime)
  const playingRef = useRef(playing)
  const isCommandPendingRef = useRef(false)
  const isProgrammaticSeekRef = useRef(false)

  // true = команда пришла с сервера, не эхоим обратно
  // const isRemoteActionRef = useRef(false)
  // true = уже отправили buffering, не спамим
  const isBufferingRef = useRef(false)
  // true = хук вообще активен (зал создан/joined)
  const isActiveRef = useRef(false)

  // Синхронизируем рефы с Redux
  useEffect(() => {
    seqNumRef.current = seqNum
  }, [seqNum])
  useEffect(() => {
    playbackUpdatedAtRef.current = playbackUpdatedAt
  }, [playbackUpdatedAt])
  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])
  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  // --- Активируем хук когда зал готов ---
  // Вызови это из компонента после setCinemaHall
  const activate = () => {
    isActiveRef.current = true
  }

  const safePlay = async (video: HTMLVideoElement) => {
    // 1. Проверка: есть ли источник?
    if (!video.src) {
      console.warn("⚠️ safePlay: video.src пуст, пропускаем play()")
      return
    }

    if (!playingRef.current) {
      console.log("🚫 safePlay: сервер говорит пауза, пропускаем play()")
      return
    }

    // 👇 Спец-обработка для blob URL (локальные файлы хоста)
    if (video.src.startsWith("blob:") && video.readyState < 2) {
      console.log("⏳ safePlay: blob, ждём readyState >= 2...")

      const onLoadedMetadata = () => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata)
        // Рекурсивно пробуем сыграть, когда метаданные точно загружены
        safePlay(video).catch(() => {})
      }
      video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true })

      // Страховка: если через 2 сек не загрузилось — пробуем играть всё равно
      setTimeout(() => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata)
        if (video.paused) safePlay(video).catch(() => {})
      }, 2000)
      return
    }

    // 2. Проверка: готово ли видео к воспроизведению?
    // readyState: 0=ничего, 1=метаданные, 2=данные, 3=можно играть, 4=полностью
    if (video.readyState < 2) {
      console.warn(
        `⚠️ safePlay: video не готов (readyState: ${video.readyState}), ждём canplay...`,
      )

      // Пробуем сыграть, когда видео будет готово (одноразовый слушатель)
      const onCanPlay = () => {
        video.removeEventListener("canplay", onCanPlay)
        // Рекурсивно вызываем safePlay, теперь видео готово
        safePlay(video).catch(() => {})
      }
      video.addEventListener("canplay", onCanPlay, { once: true })
      return
    }

    // 3. Пытаемся воспроизвести
    try {
      console.log("🔊 Вызываем video.play()...")
      await video.play()
      console.log("✅ video.play() успешно")
    } catch (e: unknown) {
      if (e instanceof DOMException) {
        // AbortError — это нормально, если play() прервали паузой
        if (e.name === "AbortError") {
          console.log("ℹ️ play() прерван (AbortError) — это ок")
          return
        }
        // NotAllowedError — браузер заблокировал автоплей со звуком
        if (e.name === "NotAllowedError") {
          console.warn(
            "⚠️ Автоплей заблокирован браузером (попробуй muted или клик пользователя)",
          )
          return
        }
        console.error("❌ Ошибка play():", e.name, e.message)
      }
      console.error("❌ Неизвестная ошибка play():", e)
    }
  }

  // --- Входящие события от сервера ---
  useEffect(() => {
    if (!socket) return

    const onSocketPlay = (data: PlayData) => {
      console.log("🎬 onPlay получен с сервера:", data)
      dispatch(applyPlay(data))
      if (!videoRef.current || !isActiveRef.current) {
        console.warn("❌ onPlay: videoRef или isActive не готовы", {
          video: !!videoRef.current,
          active: isActiveRef.current,
        })

        return
      }

      // isRemoteActionRef.current = true
      // isCommandPendingRef.current = false // 🔓 Разблокируем после серверного ответа
      const realTime =
        data.currentTime + (Date.now() - data.playbackUpdatedAt) / 1000
      console.log(
        "⏱ onPlay: устанавливаем время",
        realTime,
        "video.currentTime был:",
        videoRef.current.currentTime,
      )

      // 👇 Помечаем, что меняем время программно
      isProgrammaticSeekRef.current = true

      videoRef.current.currentTime = realTime
      console.log("🔊 onPlay: вызываем safePlay...")
      safePlay(videoRef.current) // возможно нужно оставить это
      // videoRef.current.play().catch((e) => {
      //   console.warn("⚠️ Не удалось авто-воспроизведение:", e.message)
      // })
    }

    const onSocketPause = (data: {
      currentTime: number
      playbackUpdatedAt: number
      seqNum: number
    }) => {
      dispatch(applyPause(data))
      if (!videoRef.current || !isActiveRef.current) return

      isProgrammaticSeekRef.current = true // 👈 Добавь
      // isRemoteActionRef.current = true
      // isCommandPendingRef.current = false // 🔓 Разблокируем после серверного ответа
      videoRef.current.currentTime = data.currentTime
      videoRef.current.pause()
    }

    const onSocketForcePause = (data: {
      currentTime: number
      playbackUpdatedAt: number
      seqNum: number
      waitingFor: ParticipantsType[]
    }) => {
      dispatch(applyPause(data))
      if (!videoRef.current || !isActiveRef.current) return
      isProgrammaticSeekRef.current = true // 👈 Добавь
      // isRemoteActionRef.current = true
      // isCommandPendingRef.current = false // 🔓 Разблокируем после серверного ответа
      videoRef.current.currentTime = data.currentTime
      videoRef.current.pause()
    }
    const onSocketSeek = (data: {
      position: number
      playing: boolean
      playbackUpdatedAt: number
      seqNum: number
    }) => {
      dispatch(applySeek(data))
      if (!videoRef.current || !isActiveRef.current) return

      // isRemoteActionRef.current = true
      // isCommandPendingRef.current = false // 🔓 Разблокируем после серверного ответа
      isProgrammaticSeekRef.current = true // 👈 Добавь
      if (data.playing) {
        const realTime =
          data.position + (Date.now() - data.playbackUpdatedAt) / 1000
        videoRef.current.currentTime = realTime
        safePlay(videoRef.current)
      } else {
        videoRef.current.currentTime = data.position
        videoRef.current.pause()
      }
    }

    const onUserReady = (data: {
      userId: string
      waitingFor: ParticipantsType[]
    }) => {
      dispatch(applyWaitingFor(data.waitingFor))
    }
    const onUserLeft = ({ userId }: { userId: string }) => {
      dispatch(removeParticipant(userId))
    }
    socket.on("cinema-hall:play", onSocketPlay)
    socket.on("cinema-hall:pause", onSocketPause)
    socket.on("cinema-hall:force-pause", onSocketForcePause)
    socket.on("cinema-hall:seek", onSocketSeek)
    socket.on("cinema-hall:user-ready", onUserReady)
    socket.on("cinema-hall:user-left", onUserLeft)

    return () => {
      socket.off("cinema-hall:play", onSocketPlay)
      socket.off("cinema-hall:pause", onSocketPause)
      socket.off("cinema-hall:force-pause", onSocketForcePause)
      socket.off("cinema-hall:seek", onSocketSeek)
      socket.off("cinema-hall:user-ready", onUserReady)
      socket.off("cinema-hall:user-left", onUserLeft)
    }
  }, [socket])

  // --- Drift correction ---
  useEffect(() => {
    if (!playing || !isActiveRef.current) return

    const interval = setInterval(() => {
      if (!videoRef.current || !playbackUpdatedAtRef.current) return

      const expectedTime =
        currentTimeRef.current +
        (Date.now() - playbackUpdatedAtRef.current) / 1000
      const actualTime = videoRef.current.currentTime
      const diff = expectedTime - actualTime

      if (Math.abs(diff) > 2) {
        isProgrammaticSeekRef.current = true // 👈 Добавь
        // isRemoteActionRef.current = true
        videoRef.current.currentTime = expectedTime
      } else if (diff > 0.3) {
        videoRef.current.playbackRate = 1.05
      } else if (diff < -0.3) {
        videoRef.current.playbackRate = 0.95
      } else {
        videoRef.current.playbackRate = 1
      }
    }, 5000)

    return () => {
      clearInterval(interval)
      if (videoRef.current) videoRef.current.playbackRate = 1
    }
  }, [playing])

  // --- Исходящие команды ---

  const emitPlay = () => {
    console.log(
      "📤 emitPlay: socket?",
      !!socket,
      "isActive?",
      isActiveRef.current,
    )
    if (!socket || !isActiveRef.current) return

    isCommandPendingRef.current = true // 🔒 Блокируем
    socket.emit(
      "cinema-hall:play",
      { cinemaHallId, groupId, seqNum: seqNumRef.current },
      (res: { success: boolean; error?: string }) => {
        isCommandPendingRef.current = false
        console.log("📥 emitPlay callback:", res)
        if (!res.success) console.warn("play rejected:", res.error)
      },
    )
  }

  const emitPause = () => {
    if (!socket || !videoRef.current || !isActiveRef.current) return
    isCommandPendingRef.current = true
    socket.emit(
      "cinema-hall:pause",
      {
        cinemaHallId,
        groupId,
        seqNum: seqNumRef.current,
        currentTime: videoRef.current.currentTime,
      },
      (res: { success: boolean; error?: string }) => {
        isCommandPendingRef.current = false
        if (!res.success) console.warn("pause rejected:", res.error)
      },
    )
  }

  const emitSeek = (position: number) => {
    if (!socket || !isActiveRef.current) return
    isCommandPendingRef.current = true
    socket.emit(
      "cinema-hall:seek",
      { cinemaHallId, groupId, seqNum: seqNumRef.current, position },
      (res: { success: boolean; error?: string }) => {
        isCommandPendingRef.current = false
        if (!res.success) console.warn("seek rejected:", res.error)
      },
    )
  }

  const emitBuffering = (currentTime: number, onSuccess: () => void) => {
    if (!socket || !isActiveRef.current) return
    socket.emit(
      "cinema-hall:buffering",
      { cinemaHallId, groupId, currentTime },
      (res: { success: boolean; error?: string }) => {
        console.log("success", res.success)
        if (res.success) {
          onSuccess()
        }
        if (!res.success) console.warn("play rejected:", res.error)
      },
    )
  }

  const emitReady = () => {
    if (!socket || !isActiveRef.current) return
    socket.emit(
      "cinema-hall:ready",
      { cinemaHallId, groupId },
      (res: { success: boolean; error?: string }) => {
        console.log("success", res.success)
        if (!res.success) console.warn("play rejected:", res.error)
      },
    )
  }

  const emitSync = useCallback(() => {
    if (!socket || !isActiveRef.current) return
    socket.emit(
      "cinema-hall:sync",
      { cinemaHallId, groupId },
      (res: { success: boolean; hall?: CinemaHallTargetType }) => {
        if (!res.success || !res.hall) return
        dispatch(setCinemaHall(res.hall))

        if (!videoRef.current) return
        // isRemoteActionRef.current = true

        const hall = res.hall

        if (!hall.playbackUpdatedAt) return

        const realTime = hall.playing
          ? hall.currentTime + (Date.now() - hall.playbackUpdatedAt) / 1000
          : hall.currentTime

        videoRef.current.currentTime = realTime
        if (hall.playing) {
          safePlay(videoRef.current)
        } else {
          videoRef.current.pause()
        }
      },
    )
  }, [socket, cinemaHallId, groupId, dispatch]) // Стабильные зависимости

  // --- Синхронизация когда вкладка снова активна ---
  useEffect(() => {
    if (!socket) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActiveRef.current) {
        emitSync()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [socket, emitSync])

  // --- Handlers для <video> ---

  // 👇 2. Функция для НАТИВНОГО onPlay (только локальная логика)
  const handleNativePlay = () => {
    // Просто обновляем локальный UI, если нужно
    // Например, синхронизируем иконку кнопки с состоянием видео
    console.log("🎬 Видео играет (локально)")
    // НИКАКОГО emitPlay() здесь!
  }

  const handleNativePause = () => {
    console.log("⏸ Видео на паузе (локально)")
    // НИКАКОГО emitPause() здесь!
  }
  const handlePauseRequest = () => {
    console.log("⏸ Пользователь нажал Паузу")
    if (!isActiveRef.current) return
    if (isCommandPendingRef.current) return
    emitPause() // 👈 ОТПРАВЛЯЕМ НА СЕРВЕР
  }
  const handleSeekRequest = (position: number) => {
    console.log("🔍 Пользователь перемотал на", position)
    if (!isActiveRef.current) return
    if (isCommandPendingRef.current) return
    emitSeek(position) // 👈 ОТПРАВЛЯЕМ НА СЕРВЕР
  }
  // const handleUserPlayRequest = () => {
  //   console.log(" Видео перемотка(локально)")
  //   // НИКАКОГО emitPause() здесь!
  // }

  const handlePlayRequest = () => {
    console.log("▶️ handlePlay вызван", {
      // isRemote: isRemoteActionRef.current,
      isActive: isActiveRef.current,
      hasVideo: !!videoRef.current, // boolean вместо объекта
      videoSrc: videoRef.current?.src, // string вместо элемента
      readyState: videoRef.current?.readyState, // number
    })
    // if (isRemoteActionRef.current) {
    //   isRemoteActionRef.current = false
    //   return
    // }

    if (!isActiveRef.current) {
      console.warn("❌ handlePlay: хук не активен")
      return
    }
    if (isCommandPendingRef.current) {
      console.log("⏳ Предыдущая команда ещё не выполнена, ждём...")
      return
    }

    console.log("📡 Отправляем emitPlay...")
    emitPlay()
  }

  // const handlePause = () => {
  //   if (isRemoteActionRef.current) {
  //     isRemoteActionRef.current = false
  //     return
  //   }
  //   if (!isActiveRef.current) return
  //   if (isCommandPendingRef.current) {
  //     console.log("⏳ Предыдущая команда ещё не выполнена, ждём...")
  //     return
  //   }
  //   emitPause()
  // }

  const handleSeeked = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.log("🔍 Пользователь перемотал видео (или сработал seeked)")

    // 👇 Если время менял код — игнорируем, сбрасываем флаг и выходим
    if (isProgrammaticSeekRef.current) {
      isProgrammaticSeekRef.current = false
      console.log("🚫 Программный seek, не отправляем на сервер")
      return
    }

    // 2. Если пауза — не отправляем seek на сервер
    if (!playingRef.current) return

    if (!isActiveRef.current) return
    if (isCommandPendingRef.current) {
      console.log("⏳ Предыдущая команда ещё не выполнена, ждём...")
      return
    }
    const newPosition = e.currentTarget.currentTime
    emitSeek(newPosition)
  }

  // const handleWaiting = (e: React.SyntheticEvent<HTMLVideoElement>) => {
  //   if (!isActiveRef.current) return
  //   // 👇 Добавить проверку: если вкладка скрыта — не шлём buffering
  //   if (document.visibilityState === "hidden") return
  //   if (isBufferingRef.current) return
  //   isBufferingRef.current = true

  //   const timeoutId = setTimeout(() => {
  //     isBufferingRef.current = false // Страховка
  //     console.warn("⚠️ Buffering signal timeout")
  //   }, 10000) // 10 секунд

  //   emitBuffering(e.currentTarget.currentTime, () => {
  //     clearTimeout(timeoutId)
  //     isBufferingRef.current = false
  //   })
  // }
  const handleWaiting = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!isActiveRef.current) return
    if (document.visibilityState === "hidden") return // 👈 Игнорируем, если вкладка скрыта

    // 👇 НОВАЯ ПРОВЕРКА: Если торрент почти готов — не шлем буферизацию
    // Это предотвратит ложные срабатывания, когда данные есть, но плеер "тупит"
    const torrent = torrentRef?.current
    const currentPos = videoRef.current?.currentTime || 0
    const duration = videoRef.current?.duration || 1

    // Вычисляем, какой байт нам нужен прямо сейчас
    const neededByte = torrent?.length
      ? Math.floor((currentPos / duration) * torrent.length)
      : 0

    // Если торрент скачал больше, чем нам нужно + запас 1МБ — мы готовы!
    const hasEnoughData =
      torrent && torrent.downloaded >= neededByte + 1024 * 1024

    if (hasEnoughData) {
      console.log("⚠️ onWaiting сработал, но данных достаточно — игнорируем")
      return // 👈 НЕ отправляем buffering на сервер!
    }

    // Если реально не хватает данных — шлем сигнал
    if (isBufferingRef.current) return
    isBufferingRef.current = true

    console.log(
      "📡 Реальная буферизация: скачано",
      torrent?.downloaded,
      "нужно",
      neededByte,
    )

    emitBuffering(e.currentTarget.currentTime, () => {
      isBufferingRef.current = false
    })
  }

  const handleCanPlay = () => {
    if (!isActiveRef.current) return
    // if (isRemoteActionRef.current) return // это мы сами применили команду — не реагируем
    if (!isBufferingRef.current) return // не буферили — игнорируем
    isBufferingRef.current = false
    emitReady()
  }

  return {
    activate, // ← вызови после setCinemaHall в компоненте
    // handleUserPlayRequest,
    handlePlayRequest,
    handleNativePlay,
    handleNativePause,
    handlePauseRequest,
    handleSeekRequest,

    // handlePlay,

    // handlePause,
    handleSeeked,
    handleWaiting,
    handleCanPlay,
    emitSync,
  }
}
