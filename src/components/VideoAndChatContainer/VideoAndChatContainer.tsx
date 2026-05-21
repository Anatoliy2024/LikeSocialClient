import { useEffect, useRef, useState } from "react"
import {
  ChatMovieHall,
  ChatMovieHallType,
} from "../ChatMovieHall/ChatMovieHall"
import {
  CinemaVideoPlayer,
  CinemaVideoPlayerProps,
} from "../CinemaVideoPlayer/CinemaVideoPlayer"
import style from "./VideoAndChatContainer.module.scss"

export function VideoAndChatContainer({
  videoRef,
  src,
  magnet,
  onNativePlay,
  onNativePause,
  onNativeSeeked,
  onNativeWaiting,
  onNativeCanPlay,
  onUserPlay,
  onUserPause,
  onUserSeek,
  externalPlaying,
  externalTime,
  cinemaHallId,
  groupId,
  socket,
}: Omit<CinemaVideoPlayerProps, "isFullscreen" | "showChat"> &
  Omit<ChatMovieHallType, "isFullscreen" | "showChat">) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  //   const [isCustomFullscreen, setIsCustomFullscreen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(true)
  console.log("showChat", showChat)

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return
    try {
      if (!document.fullscreenElement) {
        // 👇 ВХОДИМ в настоящий полноэкранный режим
        await wrapperRef.current.requestFullscreen()

        setShowChat(false)
      } else {
        // 👇 ВЫХОДИМ из него
        await document.exitFullscreen()

        setShowChat(true)
      }
    } catch (err) {
      console.warn("Fullscreen error:", err)
    }
  }

  return (
    <div ref={wrapperRef} className={style.videoAndChatContainer__container}>
      <CinemaVideoPlayer
        // Реф
        videoRef={videoRef}
        className={style.video}
        // Источник
        src={src}
        magnet={magnet}
        // 👇 Нативные хендлеры (события видео)
        onNativePlay={onNativePlay}
        onNativePause={onNativePause}
        onNativeSeeked={onNativeSeeked}
        onNativeWaiting={onNativeWaiting}
        onNativeCanPlay={onNativeCanPlay}
        // 👇 Хендлеры действий пользователя (кнопки)
        onUserPlay={onUserPlay}
        onUserPause={onUserPause}
        onUserSeek={onUserSeek}
        // 👇 Управляющие пропсы (от сервера)
        externalPlaying={externalPlaying}
        externalTime={externalTime}
        //chat
        showChat={showChat}
        toggleFullscreen={toggleFullscreen}
        onToggleChat={() => setShowChat((prev) => !prev)}
        isFullscreen={isFullscreen}
      />

      <ChatMovieHall
        showChat={showChat}
        cinemaHallId={cinemaHallId}
        groupId={groupId}
        socket={socket}
        isFullscreen={isFullscreen}
      />
    </div>
  )
}
