// components/CinemaVideoPlayer/CinemaVideoPlayer.tsx
import { useState, useEffect } from "react"
import style from "./CinemaVideoPlayer.module.scss"

interface CinemaVideoPlayerProps {
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
}

// Вспомогательная функция (можно вынести в utils)
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
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
  // playbackRate = 1,
  className,
}: CinemaVideoPlayerProps) {
  // Локальные стейты только для UI контролов
  const [localVolume, setLocalVolume] = useState(volume)
  // const [localRate, setLocalRate] = useState(playbackRate)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  // 👇 Синхронизация внешних пропсов с локальным стейтом
  useEffect(() => {
    setLocalVolume(volume)
  }, [volume])
  // useEffect(() => {
  //   setLocalRate(playbackRate)
  // }, [playbackRate])

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

  // const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const rate = Number(e.target.value)
  //   setLocalRate(rate)
  //   if (videoRef.current) {
  //     videoRef.current.playbackRate = rate
  //   }
  // }

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
    <div className={`${style.player} ${className || ""}`}>
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
      <div className={style.controls}>
        {/* Кнопки плей/пауза (действия пользователя) */}
        <div className={style.progressControl}>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={handleProgressChange}
            className={style.progressBar}
            step={0.1}
          />
          {/* Опционально: время */}
          <span className={style.timeDisplay}>
            {formatTime(videoRef.current?.currentTime || 0)} /{" "}
            {formatTime(duration)}
          </span>
        </div>

        <div className={style.mainControls}>
          <button onClick={onUserPlay}>▶️</button>
          <button onClick={onUserPause}>⏸</button>
        </div>

        {/* Громкость */}
        <div className={style.volumeControl}>
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
          <input
            type="range"
            min={0}
            max={100}
            value={localVolume}
            onChange={handleVolumeChange}
          />
        </div>

        {/* Скорость
        <div className={style.rateControl}>
          <span>⚡</span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={localRate}
            onChange={handleRateChange}
          />
          <span>{localRate.toFixed(1)}x</span>
        </div> */}

        {/* Кнопки дополнительных действий */}
        <div className={style.extraControls}>
          <button onClick={togglePiP}>
            {document.pictureInPictureElement ? "🔙 Вернуть" : "📺 PiP"}
          </button>

          <button
            onClick={() =>
              onUserSeek?.((videoRef.current?.currentTime || 0) + 30)
            }
          >
            ⏩ +30с
          </button>
        </div>
      </div>
    </div>
  )
}
