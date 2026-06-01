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
import { getServerNow } from "./useClockSync"

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

// 👇 1. Проверяет, загрузил ли браузер данные видео для текущей позиции воспроизведения
const isCurrentTimeBuffered = (video: HTMLVideoElement): boolean => {
  const time = video.currentTime
  for (let i = 0; i < video.buffered.length; i++) {
    const start = video.buffered.start(i)
    const end = video.buffered.end(i)
    // Если текущее время попадает в любой загруженный диапазон — данные есть
    if (time >= start && time <= end) return true
  }
  return false
}
// 👇 Проверяет, есть ли буфер хотя бы на N секунд вперёд от текущей позиции
const hasBufferHeadroom = (
  video: HTMLVideoElement,
  minSeconds = 5,
): boolean => {
  const currentTime = video.currentTime
  for (let i = 0; i < video.buffered.length; i++) {
    const end = video.buffered.end(i)
    // Если конец любого буфера хотя бы на minSeconds впереди — ок
    if (end - currentTime >= minSeconds) {
      return true
    }
  }
  return false
}

// 👇 2. Проверяет, скачал ли WebTorrent достаточно байтов файла для текущей секунды
const hasTorrentHeadroom = (
  video: HTMLVideoElement,
  torrent: TorrentInstance, // или импортируй TorrentInstance из своих типов
  minSeconds = 5,
  marginBytes = 1 * 1024 * 1024, // 2MB запас на опережение
): boolean => {
  if (!torrent || !video.duration || !isFinite(video.duration)) return false

  // На какой секунде мы + запас
  const targetSecond = Math.min(video.duration, video.currentTime + minSeconds)
  const progressRatio = targetSecond / video.duration
  const neededBytes = Math.floor(torrent.length * progressRatio) + marginBytes

  return torrent.downloaded >= neededBytes
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
  const readyCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const justSentReadyRef = useRef(false)
  const lastBufferingEmitRef = useRef(0)

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

  //функция проверки готово ли видео
  const checkIsReady = (minSeconds = 5): boolean => {
    const video = videoRef.current
    const torrent = torrentRef?.current
    if (!video) return false

    return (
      video.readyState >= 3 &&
      isCurrentTimeBuffered(video) &&
      hasBufferHeadroom(video, minSeconds) &&
      (torrent ? hasTorrentHeadroom(video, torrent, minSeconds) : true)
    )
  }

  // 👇 Функция запуска проверки
  const startReadyCheck = () => {
    if (readyCheckIntervalRef.current) return // Уже запущен

    readyCheckIntervalRef.current = setInterval(() => {
      // const video = videoRef.current
      // const torrent = torrentRef?.current

      // if (!video || !isActiveRef.current) return

      // // 👇 Комбинированная проверка:
      // const isReady =
      //   video.readyState >= 3 && // HAVE_FUTURE_DATA
      //   isCurrentTimeBuffered(video) && // Текущая позиция в буфере
      //   hasBufferHeadroom(video, 5) && // 👈 НОВ: +5 секунд вперёд
      //   (torrent ? hasTorrentHeadroom(video, torrent, 5) : true)

      if (checkIsReady()) {
        // console.log("✅ Все проверки пройдены — отправляем ready")
        stopReadyCheck()
        emitReady(() => {
          isBufferingRef.current = false
        }) // 👈 Отправляем на сервер!
      }
    }, 500) // Проверяем каждые 0.5 сек
  }

  // 👇 Функция остановки проверки
  const stopReadyCheck = () => {
    if (readyCheckIntervalRef.current) {
      clearInterval(readyCheckIntervalRef.current)
      readyCheckIntervalRef.current = null
    }
  }

  // 👇 Не забудь очистить интервал при размонтировании
  useEffect(() => {
    return () => {
      stopReadyCheck()
    }
  }, [])

  const safePlay = async (video: HTMLVideoElement) => {
    // console.log("safePlay is play****************")
    // 1. Проверка: есть ли источник?
    if (!video.src) {
      console.warn("⚠️ safePlay: video.src пуст, пропускаем play()")
      return
    }

    if (!playingRef.current) {
      console.log("🚫 safePlay: сервер говорит пауза, пропускаем play()")
      return
    }

    // 👇 Если видео в состоянии ожидания (waiting) — не пытайся играть
    if (video.readyState < 2 || video.networkState === 3) {
      // 3 = NETWORK_NO_SOURCE / buffering
      console.log(
        "⏳ safePlay: видео еще не готово (networkState/readyState), пропускаем",
      )
      return
    }

    // 👇 Спец-обработка для blob URL (локальные файлы хоста)
    if (video.src.startsWith("blob:") && video.readyState < 2) {
      // console.log("⏳ safePlay: blob, ждём readyState >= 2...")

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
    // if (video.readyState < 2) {
    //   console.warn(
    //     `⚠️ safePlay: video не готов (readyState: ${video.readyState}), ждём canplay...`,
    //   )

    //   // Пробуем сыграть, когда видео будет готово (одноразовый слушатель)
    //   const onCanPlay = () => {
    //     video.removeEventListener("canplay", onCanPlay)
    //     // Рекурсивно вызываем safePlay, теперь видео готово
    //     safePlay(video).catch(() => {})
    //   }
    //   video.addEventListener("canplay", onCanPlay, { once: true })
    //   return
    // }

    // 3. Пытаемся воспроизвести
    try {
      // console.log("🔊 Вызываем video.play()...")
      await video.play()
      // console.log("✅ video.play() успешно")
    } catch (e: unknown) {
      if (e instanceof DOMException) {
        // AbortError — это нормально, если play() прервали паузой
        if (e.name === "AbortError") {
          // console.log("ℹ️ play() прерван (AbortError) — это ок")
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
      dispatch(applyPlay(data))
      if (!videoRef.current || !isActiveRef.current) {
        console.warn("❌ onPlay: videoRef или isActive не готовы", {
          video: !!videoRef.current,
          active: isActiveRef.current,
        })

        return
      }

      const realTime =
        data.currentTime + (getServerNow() - data.playbackUpdatedAt) / 1000

      isProgrammaticSeekRef.current = true

      videoRef.current.currentTime = realTime

      // const canActuallyPlay =
      //   isCurrentTimeBuffered(videoRef.current) &&
      //   hasBufferHeadroom(videoRef.current, 2) // 2 секунды форы достаточно для старта

      if (checkIsReady(2)) {
        safePlay(videoRef.current)
      } // возможно нужно оставить это
      else {
        // 👇 Если данных нет — не дергаем play(), пусть сработает handleWaiting
        console.log("⏳ onSocketPlay: данных нет, ждем буферизации...")
      }
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

      isProgrammaticSeekRef.current = true // 👈 Добавь
      if (data.playing) {
        const realTime =
          data.position + (getServerNow() - data.playbackUpdatedAt) / 1000
        videoRef.current.currentTime = realTime

        // 👇 ПРОВЕРКА: есть ли данные для этой позиции?
        // const canActuallyPlay =
        //   isCurrentTimeBuffered(videoRef.current) &&
        //   hasBufferHeadroom(videoRef.current, 2) // 2 секунды форы достаточно для старта

        if (checkIsReady(2)) {
          safePlay(videoRef.current)
        } else {
          // 👇 Если данных нет — не дергаем play(), пусть сработает handleWaiting
          console.log("⏳ onSocketPlay: данных нет, ждем буферизации...")
        }
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
        (getServerNow() - playbackUpdatedAtRef.current) / 1000
      const actualTime = videoRef.current.currentTime
      const diff = expectedTime - actualTime

      // // 👇 НОВОЕ: Если отстал больше чем на 10 секунд — синхронизируемся СРАЗУ
      // if (Math.abs(diff) > 10) {
      //   // console.log(
      //   //   `🚀 Большой рассинхрон (${diff.toFixed(1)}с) — немедленная синхронизация`,
      //   // )
      //   isProgrammaticSeekRef.current = true
      //   videoRef.current.currentTime = expectedTime
      //   // Не меняем playbackRate, пусть сразу играет с нужной позиции
      //   setTimeout(() => {
      //     isProgrammaticSeekRef.current = false
      //   }, 100)
      //   return
      // }

      if (Math.abs(diff) > 10) {
        // Если рассинхрон больше 5 минут — это явно баг часов, не трогаем
        if (Math.abs(diff) > 300) {
          console.warn(
            `⚠️ Drift слишком большой (${diff.toFixed(0)}с) — пропускаем`,
          )
          return
        }

        const safeTime = Math.max(
          0,
          Math.min(videoRef.current.duration || Infinity, expectedTime),
        )
        isProgrammaticSeekRef.current = true
        videoRef.current.currentTime = safeTime
        setTimeout(() => {
          isProgrammaticSeekRef.current = false
        }, 100)
        return
      }

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
    // console.log(
    //   "📤 emitPlay: socket?",
    //   !!socket,
    //   "isActive?",
    //   isActiveRef.current,
    // )
    if (!socket || !isActiveRef.current) return

    isCommandPendingRef.current = true // 🔒 Блокируем
    socket.emit(
      "cinema-hall:play",
      { cinemaHallId, groupId, seqNum: seqNumRef.current },
      (res: {
        success: boolean
        error?: string
        waitingForUsers: string[]
      }) => {
        isCommandPendingRef.current = false
        // console.log("📥 emitPlay callback:", res)
        if (!res.success) {
          console.warn("play rejected:", res.error)
          // console.log("waitingForUsers", res.waitingForUsers)
        }
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
        // console.log("emitSeek collback success", res.success)
        // console.log("emitSeek collback error", res.error)
        isCommandPendingRef.current = false
        if (!res.success) console.warn("seek rejected:", res.error)
      },
    )
  }

  const emitBuffering = (currentTime: number, onSuccess: () => void) => {
    if (!socket || !isActiveRef.current) return

    // ✅ Не спамим чаще раза в 3 секунды
    const now = Date.now()
    if (now - lastBufferingEmitRef.current < 1500) {
      console.log("⏳ emitBuffering: throttle, пропускаем")
      return
    }
    lastBufferingEmitRef.current = now

    socket.emit(
      "cinema-hall:buffering",
      { cinemaHallId, groupId, currentTime },
      (res: { success: boolean; error?: string }) => {
        // console.log("success", res.success)
        if (res.success) {
          onSuccess()
        }
        if (!res.success) console.warn("play rejected:", res.error)
      },
    )
  }

  const emitReady = (onSuccess?: () => void) => {
    if (!socket || !isActiveRef.current) return

    justSentReadyRef.current = true
    //обнуление 3 секундного интервала чтобы обойти защиту в emitBuffering
    // lastBufferingEmitRef.current = 0

    socket.emit(
      "cinema-hall:ready",
      { cinemaHallId, groupId },
      (res: { success: boolean; error?: string }) => {
        if (res.success) {
          onSuccess?.() // ✅ сбрасываем isBuffering только здесь
        }
        // console.log("success", res.success)
        if (!res.success) console.warn("play rejected:", res.error)
      },
    )

    // 👇 Игнорируем onWaiting следующие 800мс (время на "раскачку" видео)
    setTimeout(() => {
      justSentReadyRef.current = false
    }, 800)
  }

  const emitSync = useCallback(() => {
    if (!socket || !isActiveRef.current) return
    socket.emit(
      "cinema-hall:sync",
      { cinemaHallId, groupId },
      (res: { success: boolean; hall?: CinemaHallTargetType }) => {
        if (!res.success || !res.hall) return
        dispatch(setCinemaHall(res.hall))

        playingRef.current = res.hall.playing

        if (!videoRef.current) return
        // isRemoteActionRef.current = true

        const hall = res.hall
        if (!hall.playbackUpdatedAt) return

        const realTime = hall.playing
          ? hall.currentTime + (getServerNow() - hall.playbackUpdatedAt) / 1000
          : hall.currentTime

        videoRef.current.currentTime = realTime
        if (hall.playing) {
          // const canPlay =
          //   isCurrentTimeBuffered(videoRef.current) &&
          //   hasBufferHeadroom(videoRef.current, 2)
          if (checkIsReady(2)) safePlay(videoRef.current)
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
        const isMobile = window.matchMedia("(pointer: coarse)").matches
        if (!isMobile) return

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
    // console.log("🎬 Видео играет (локально)")
    // НИКАКОГО emitPlay() здесь!
  }

  const handleNativePause = () => {
    // console.log("⏸ Видео на паузе (локально)")
    // НИКАКОГО emitPause() здесь!
  }
  const handlePauseRequest = () => {
    // console.log("⏸ Пользователь нажал Паузу")
    if (!isActiveRef.current) return
    if (isCommandPendingRef.current) return
    emitPause() // 👈 ОТПРАВЛЯЕМ НА СЕРВЕР
  }
  const handleSeekRequest = (position: number) => {
    // console.log("🔍 Пользователь перемотал на", position)
    if (!isActiveRef.current) return
    if (isCommandPendingRef.current) return
    // console.log("handleSeekRequest", position)
    emitSeek(position) // 👈 ОТПРАВЛЯЕМ НА СЕРВЕР
  }

  const handlePlayRequest = () => {
    // console.log("▶️ handlePlay вызван", {
    //   // isRemote: isRemoteActionRef.current,
    //   isActive: isActiveRef.current,
    //   hasVideo: !!videoRef.current, // boolean вместо объекта
    //   videoSrc: videoRef.current?.src, // string вместо элемента
    //   readyState: videoRef.current?.readyState, // number
    // })

    if (!isActiveRef.current) {
      console.warn("❌ handlePlay: хук не активен")
      return
    }
    if (isCommandPendingRef.current) {
      // console.log("⏳ Предыдущая команда ещё не выполнена, ждём...")
      return
    }

    // console.log("📡 Отправляем emitPlay...")
    emitPlay()
  }

  const handleSeeked = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    // console.log("🔍 Пользователь перемотал видео (или сработал seeked)")

    // 👇 Если время менял код — игнорируем, сбрасываем флаг и выходим
    if (isProgrammaticSeekRef.current) {
      isProgrammaticSeekRef.current = false
      // console.log("🚫 Программный seek, не отправляем на сервер")
      return
    }

    // 2. Если пауза — не отправляем seek на сервер
    if (!playingRef.current) return

    if (!isActiveRef.current) return
    if (isCommandPendingRef.current) {
      // console.log("⏳ Предыдущая команда ещё не выполнена, ждём...")
      return
    }
    const newPosition = e.currentTarget.currentTime
    emitSeek(newPosition)
  }

  // 👇 Запускаем проверку, когда видео "заголодало"
  const handleWaiting = () => {
    // 👇 Если только что отправили ready — игнорируем onWaiting (грациозный период)
    if (justSentReadyRef.current) {
      console.log("⚠️ onWaiting в грациозном периоде после ready — игнорируем")
      return
    }
    console.log("handleWaiting сработал")

    if (!isActiveRef.current) return
    if (document.visibilityState === "hidden") return

    // Если реально не хватает данных — шлем буферизацию
    if (!isBufferingRef.current) {
      isBufferingRef.current = true

      // Берём время из стейта (currentTimeRef) а не из video.currentTime
      // который может быть 0 пока видео не буферизовалось
      // if (!playbackUpdatedAtRef.current) return

      const actualCurrentTime =
        playingRef.current && playbackUpdatedAtRef.current
          ? currentTimeRef.current +
            (getServerNow() - playbackUpdatedAtRef.current) / 1000
          : currentTimeRef.current

      emitBuffering(actualCurrentTime, () => {
        // 👇 Когда сервер подтвердил — запускаем периодическую проверку готовности
        startReadyCheck()
      })
    }
  }

  const handleCanPlay = () => {
    console.log("✅ handleCanPlay вызван:", {
      isActive: isActiveRef.current,
      isBuffering: isBufferingRef.current,
      currentTime: videoRef.current?.currentTime,
      buffered: videoRef.current?.buffered.length,
      torrentProgress: torrentRef?.current?.progress,
    })

    if (!isActiveRef.current) return
    // stopReadyCheck()
    // if (isRemoteActionRef.current) return // это мы сами применили команду — не реагируем
    if (!isBufferingRef.current) return // не буферили — игнорируем

    // Сбрасываем ТОЛЬКО после подтверждения сервера
    // emitReady(() => {
    //   isBufferingRef.current = false
    // })
    // const video = videoRef.current
    // const torrent = torrentRef?.current
    // if (!video) return

    // // 👇 ПРОВЕРЯЕМ ГОТОВНОСТЬ ПРЯМО ЗДЕСЬ
    // const isReady =
    //   video.readyState >= 3 &&
    //   isCurrentTimeBuffered(video) &&
    //   hasBufferHeadroom(video, 5) &&
    //   (torrent ? hasTorrentHeadroom(video, torrent, 5) : true)

    if (checkIsReady()) {
      // 🚀 Если готовы — отправляем ready СРАЗУ и останавливаем интервал
      stopReadyCheck()
      emitReady(() => {
        isBufferingRef.current = false
      })
    }

    // startReadyCheck()
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
