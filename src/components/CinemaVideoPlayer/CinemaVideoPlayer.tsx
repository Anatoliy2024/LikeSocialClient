// components/CinemaVideoPlayer/CinemaVideoPlayer.tsx
import { useState, useEffect, useRef } from "react"
import style from "./CinemaVideoPlayer.module.scss"
import { formatTime } from "@/utils/formatTime"
import { ChatWithSmile } from "@/assets/icons/chatWithSmile"

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
  onUserPlay?: () => void
  onUserPause?: () => void
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
}

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
  // playbackRate = 1,
}: CinemaVideoPlayerProps) {
  // Локальные стейты только для UI контролов
  const [localVolume, setLocalVolume] = useState(volume)
  // const [localRate, setLocalRate] = useState(playbackRate)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const [showValue, setShowValue] = useState(false)
  const [showControl, setShowControl] = useState(false)
  // В начале компонента, рядом с другими useState/useRef:
  const playerContainerRef = useRef<HTMLDivElement>(null)

  // Переключатель

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

  const togglePiP = async () => {
    if (!videoRef.current) return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (err) {
      console.error("❌ PiP ошибка:", err)
    }
  }

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

  return (
    <div
      className={`${style.player} ${isFullscreen ? style.fullscreen : ""}`}
      ref={playerContainerRef}
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
      />

      {/* 👇 Кастомные контролы */}
      <div
        className={`${style.player__controls} ${!showControl ? style.player__controlsHidden : ""}`}
        onMouseEnter={() => setShowControl(true)}
        onMouseLeave={() => setShowControl(false)}
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
          />
        </div>
        <div className={style.player__controlsBottomLine}>
          <div className={style.player__controlsMainControls}>
            <div className={style.player__controlsItem}>
              {!externalPlaying && <button onClick={onUserPlay}>▶️</button>}
              {externalPlaying && <button onClick={onUserPause}>⏸</button>}
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
            >
              ⏩ +30с
            </button>
          </div>

          {/* Кнопки дополнительных действий */}
          <div className={style.player__controlsExtraControls} title="Чат">
            {isFullscreen && (
              <div>
                <button
                  className={`${style.player__controlsItem}  ${showChat ? style.player__controlsItemActive : ""}`}
                  // style={{ background: showChat ? "rgba(255,0,0,0.3)" : "" }}
                  onClick={onToggleChat}
                >
                  <ChatWithSmile />
                </button>
              </div>
            )}

            <div>
              <button
                onClick={togglePiP}
                className={style.player__controlsItem}
              >
                {document.pictureInPictureElement ? "🔙 Вернуть" : "📺 "}
              </button>
            </div>
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
    </div>
  )
}
