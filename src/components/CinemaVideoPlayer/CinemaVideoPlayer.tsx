// components/CinemaVideoPlayer/CinemaVideoPlayer.tsx
import { useState, useEffect, useRef, useCallback } from "react"
import style from "./CinemaVideoPlayer.module.scss"
import { formatTime } from "@/utils/formatTime"
import { ChatWithSmile } from "@/assets/icons/chatWithSmile"
import { PauseIcon } from "@/assets/icons/pauseIcon"
import { PlayIcon } from "@/assets/icons/playIcon"
import { useSocket } from "@/providers/SocketProvider"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { changeMemberControl } from "@/store/slices/cinemaHallSlice"

export interface CinemaVideoPlayerProps {
  // 👇 Видео-источники
  src: string | null
  magnet: string | null

  // 👇 Реф на видео (приходит из WatchPage, где создан)
  videoRef: React.RefObject<HTMLVideoElement | null>

  // 👇 Нативные обработчики видео (из useCinemaHallSync)
  // Эти функции НЕ отправляют команды на сервер, только локальная логика
  onNativePlay?: () => void
  onNativePause?: () => void

  // Эти функции отправляют состояния на сервер (буферизация, готовность, перемотка)
  onNativeSeeked?: (e: React.SyntheticEvent<HTMLVideoElement>) => void
  onNativeWaiting?: (e: React.SyntheticEvent<HTMLVideoElement>) => void
  // onNativeSeeked?: (time: number) => void
  // onNativeWaiting?: (time: number) => void
  onNativeCanPlay?: () => void

  // 👇 Обработчики действий пользователя (клик по кнопкам → сервер)
  onUserPlay: () => void
  onUserPause: () => void
  onUserSeek?: (time: number) => void

  // 👇 Управляющие пропсы (сервер → клиент)
  externalPlaying?: boolean
  externalTime?: number
  volume?: number
  playbackRate?: number

  // 👇 UI-пропсы
  className?: string

  //chat
  // handleShowChat: () => void
  // handleCloseChat: () => void
  // showChat: boolean
  // isCustomFullscreen: boolean
  // handleShowFullscreenVideo: () => void
  // handleCloseFullscreenVideo: () => void
  // 👇 ЗАМЕНИ старые пропсы на эти:
  toggleFullscreen?: () => void // Функция для кнопки
  isFullscreen?: boolean // Реальный статус от родителя
  showChat?: boolean // Показывать ли чат
  onToggleChat?: () => void // Переключатель чата
  isHost: boolean
  cinemaHallId: string
  groupId: string
}

const HIDE_DELAY = 3000
export function CinemaVideoPlayer({
  src,
  videoRef, // 👇 Получаем реф извне
  // Нативные хендлеры (события видео)
  onNativePlay,
  onNativePause,
  onNativeSeeked,
  onNativeWaiting,
  onNativeCanPlay,
  // Хендлеры действий пользователя (кнопки)
  onUserPlay,
  onUserPause,
  onUserSeek,
  // Управляющие пропсы
  externalPlaying,
  externalTime,
  volume = 100,
  //chat
  toggleFullscreen, // Функция для кнопки
  isFullscreen, // Реальный статус от родителя
  showChat, // Показывать ли чат
  onToggleChat, // Переключатель чата
  isHost,
  cinemaHallId,
  groupId,
  // playbackRate = 1,
}: CinemaVideoPlayerProps) {
  const socket = useSocket()
  const dispatch = useAppDispatch()
  // Локальные стейты только для UI контролов
  const [localVolume, setLocalVolume] = useState(volume)
  // const [localRate, setLocalRate] = useState(playbackRate)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(false)

  const [showValue, setShowValue] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  // const [showControl, setShowControl] = useState(false)
  // В начале компонента, рядом с другими useState/useRef:

  const playerContainerRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // const containerRef = useRef<HTMLDivElement>(null);

  const isMembersControl = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.isMembersControl,
  )

  const showControls = useCallback(() => {
    setControlsVisible(true)

    // Сбрасываем предыдущий таймер
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }

    // Запускаем новый таймер на скрытие
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false)
    }, HIDE_DELAY)
  }, [])

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  // 👇 Синхронизация внешних пропсов с локальным стейтом
  useEffect(() => {
    setLocalVolume(volume)
  }, [volume])

  // 👇 Применение внешних команд к видео (от сервера)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // 👇 1. ПРИОРИТЕТ: Если сервер сказал ПАУЗА — останавливаем сразу и выходим
    if (externalPlaying === false) {
      video.pause()
      return // 🔥 Ключевое: прерываем выполнение, чтобы не сработало play()
    }

    // Play/Pause от сервера
    if (externalPlaying === true && video.paused) {
      video.play().catch((e) => {
        if (e.name !== "AbortError") console.warn("⚠️ Автоплей:", e.message)
      })
    }

    // Синхронизация времени (с защитой от дребезга)
    if (externalTime !== undefined) {
      const diff = Math.abs(video.currentTime - externalTime)
      if (diff > 0.5) {
        video.currentTime = externalTime
      }
    }

    // Применение громкости и скорости
    video.volume = localVolume / 100
    // video.playbackRate = localRate
  }, [externalPlaying, externalTime, videoRef])

  // 👇 Обработчики кастомных контролов (громкость, скорость)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value)
    setLocalVolume(vol)
    if (videoRef.current) {
      videoRef.current.volume = vol / 100
      if (vol > 0 && videoRef.current.muted) {
        videoRef.current.muted = false
        setIsMuted(false)
      }
    }
  }

  // const togglePiP = async () => {
  //   if (!videoRef.current) return
  //   try {
  //     if (document.pictureInPictureElement) {
  //       await document.exitPictureInPicture()
  //     } else {
  //       await videoRef.current.requestPictureInPicture()
  //     }
  //   } catch (err) {
  //     console.error("❌ PiP ошибка:", err)
  //   }
  // }

  // 👇 Обновление прогресса при воспроизведении
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    setProgress((video.currentTime / video.duration) * 100)
  }

  // 👇 Сохранение длительности при загрузке метаданных
  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (video?.duration) {
      setDuration(video.duration)
    }
  }

  // 👇 Обработчик перемотки (когда пользователь тянет ползунок)
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video || !duration) return

    const newProgress = Number(e.target.value)
    setProgress(newProgress)

    // Вычисляем новое время и применяем
    const newTime = (newProgress / 100) * duration
    video.currentTime = newTime

    // Если нужно отправить на сервер (синхронизация с другими)
    if (onUserSeek) {
      onUserSeek(newTime)
    }
  }
  const onUserPlayWithAnimation = () => {
    onUserPlay()
    setIsPlaying(true)
    setAnimationKey((prev) => prev + 1)
  }
  const onUserPauseWithAnimation = () => {
    onUserPause()
    setIsPlaying(false)
    setAnimationKey((prev) => prev + 1)
  }

  useEffect(() => {
    if (!socket) return
    const changeMemberControlHandler = (data: {
      isMembersControl: boolean
    }) => {
      dispatch(changeMemberControl(data.isMembersControl))
    }
    socket.on("cinema-hall:change-member-control", changeMemberControlHandler)
    return () => {
      socket.off(
        "cinema-hall:change-member-control",
        changeMemberControlHandler,
      )
    }
  }, [socket, dispatch])

  const onToggleMemberControl = () => {
    if (!socket) return
    socket.emit(
      "cinema-hall:toggle-members-control",
      { groupId, cinemaHallId },
      (data: { success: boolean; isMembersControl: boolean }) => {
        if (data.success) {
          dispatch(changeMemberControl(data.isMembersControl))
        }
      },
    )
  }

  const isBlockButtonControl = !isHost && isMembersControl
  return (
    <div
      className={`${style.player} ${isFullscreen ? style.fullscreen : ""} ${!controlsVisible ? style.hiddenCursor : ""}`}
      ref={playerContainerRef}
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onMouseLeave={() => {
        // Сразу скрываем при уходе курсора с видео (опционально)
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        setControlsVisible(false)
      }}
      // style={{ position: "relative", width: "100%", cursor: controlsVisible ? "default" : "none" }}
    >
      {/* 👇 Видео с правильными хендлерами */}
      <video
        ref={videoRef} // 👇 Реф приходит из WatchPage
        src={src || undefined}
        className={style.video}
        // Нативные события → хендлеры из useCinemaHallSync
        onPlay={onNativePlay}
        onPause={onNativePause}
        onSeeked={onNativeSeeked}
        onWaiting={onNativeWaiting}
        onCanPlay={onNativeCanPlay}
        // 👇 Новые события для прогресс-бара
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={(e) => {
          e.preventDefault()
          if (isBlockButtonControl) return
          if (externalPlaying) {
            onUserPauseWithAnimation()
          } else {
            onUserPlayWithAnimation()
          }
          // {!externalPlaying && <button onClick={onUserPlay}>▶️</button>}
          //     {externalPlaying && <button onClick={onUserPause}>⏸</button>}
        }}
      />

      {/* 👇 Кастомные контролы */}
      <div
        className={`${style.player__controls} ${!controlsVisible ? style.player__controlsHidden : ""}`}
      >
        {/* Кнопки плей/пауза (действия пользователя) */}
        <div className={style.player__controlsTopLine}>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={handleProgressChange}
            className={style.player__progressBar}
            step={0.1}
            disabled={isBlockButtonControl}
          />
        </div>
        <div className={style.player__controlsBottomLine}>
          <div className={style.player__controlsMainControls}>
            <div className={style.player__controlsItem}>
              {!externalPlaying && (
                <button
                  onClick={onUserPlayWithAnimation}
                  disabled={isBlockButtonControl}
                >
                  ▶️
                </button>
              )}
              {externalPlaying && (
                <button
                  onClick={onUserPauseWithAnimation}
                  disabled={isBlockButtonControl}
                >
                  ⏸
                </button>
              )}
            </div>
            {/* Громкость */}
            <div
              className={`${style.player__volumeControl} ${style.player__controlsItem}`}
              onMouseEnter={() => setShowValue(true)}
              onMouseLeave={() => setShowValue(false)}
            >
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.muted = !videoRef.current.muted
                    setIsMuted(!isMuted)
                  }
                }}
              >
                {isMuted || localVolume === 0 ? "🔇" : "🔊"}
              </button>
              {showValue && (
                <input
                  // className={style.player__controlsItem}
                  type="range"
                  min={0}
                  max={100}
                  value={localVolume}
                  onChange={handleVolumeChange}
                />
              )}
            </div>
            <div className={style.progressControl}>
              {/* Опционально: время */}
              <span className={style.timeDisplay}>
                {formatTime(videoRef.current?.currentTime || 0)} /{" "}
                {formatTime(duration)}
              </span>
            </div>
            <button
              className={style.player__controlsItem}
              onClick={() =>
                onUserSeek?.((videoRef.current?.currentTime || 0) + 30)
              }
              disabled={isBlockButtonControl}
            >
              ⏩ +30с
            </button>
          </div>

          {/* Кнопки дополнительных действий */}
          <div className={style.player__controlsExtraControls}>
            <div title="Заблокировать контроль видео всем юзерам">
              <button
                className={`${style.player__controlsItem}  ${isMembersControl ? style.player__controlsItemActive : ""}`}
                // style={{ background: showChat ? "rgba(255,0,0,0.3)" : "" }}
                disabled={!isHost}
                onClick={onToggleMemberControl}
              >
                <div>X</div>
              </button>
            </div>

            {isFullscreen && (
              <div title="Чат">
                <button
                  className={`${style.player__controlsItem}  ${showChat ? style.player__controlsItemActive : ""}`}
                  // style={{ background: showChat ? "rgba(255,0,0,0.3)" : "" }}
                  onClick={onToggleChat}
                >
                  <ChatWithSmile />
                </button>
              </div>
            )}

            {/* <div title="Мини-плеер">
              <button
                onClick={togglePiP}
                className={style.player__controlsItem}
              >
                {document?.pictureInPictureElement ? "🔙 Вернуть" : "📺 "}
              </button>
            </div> */}
            <div>
              <button
                onClick={toggleFullscreen}
                className={style.player__controlsItem}
                title={
                  isFullscreen ? "Выйти из полноэкранного" : "На весь экран"
                }
              >
                {isFullscreen ? "⛶" : "⛶"}
                {/* Замени иконки на свои, например: 🔲 / ⛶ */}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div key={animationKey} className={style.player__showStatusAnimation}>
        {isPlaying ? <PlayIcon /> : <PauseIcon />}
      </div>
    </div>
  )
}
