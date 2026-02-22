"use client"
import { useEffect, useRef } from "react"
import { useAppSelector } from "@/store/hooks"
// import { useGroupCallContext } from "@/app/GroupCallProvider"
import { RootState } from "@/store/store"
import styles from "./GroupCallPanel.module.scss"
import { useGroupCallContext } from "@/providers/GroupCallProvider"

export const GroupCallPanel = () => {
  const status = useAppSelector((s: RootState) => s.groupCall.status)
  const { isAudioEnabled, isVideoEnabled, participants } = useAppSelector(
    (s: RootState) => s.groupCall
  )
  const {
    leaveCall,
    handleToggleAudio,
    handleToggleVideo,
    remoteStreams,
    // localStream,
  } = useGroupCallContext()

  if (status !== "inCall") return null

  return (
    <div className={styles.panel}>
      <div className={styles.info}>
        <span className={styles.dot} />
        <span className={styles.label}>Voice</span>
        <span className={styles.count}>{participants.length + 1} member</span>
      </div>

      <div className={styles.streams}>
        {/* Локальный аудио не нужен, только remote */}
        {Object.entries(remoteStreams).map(([socketId, stream]) => (
          <AudioStream key={socketId} stream={stream} />
        ))}
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.btn} ${!isAudioEnabled ? styles.btnOff : ""}`}
          onClick={handleToggleAudio}
          title={isAudioEnabled ? "Выключить микрофон" : "Включить микрофон"}
        >
          {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
        </button>

        <button
          className={`${styles.btn} ${isVideoEnabled ? styles.btnActive : ""}`}
          onClick={handleToggleVideo}
          title={isVideoEnabled ? "Выключить камеру" : "Включить камеру"}
        >
          {isVideoEnabled ? <VideoIcon /> : <VideoOffIcon />}
        </button>

        <button
          className={`${styles.btn} ${styles.btnLeave}`}
          onClick={leaveCall}
          title="Покинуть беседу"
        >
          <PhoneOffIcon />
        </button>
      </div>
    </div>
  )
}

// Компонент для воспроизведения аудио стрима
const AudioStream = ({ stream }: { stream: MediaStream }) => {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream
    }
  }, [stream])

  return <audio ref={audioRef} autoPlay playsInline />
}

// SVG иконки
const MicIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
  </svg>
)

const MicOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8" />
  </svg>
)

const VideoIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
)

const VideoOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34" />
    <path d="M23 7l-7 5 7 5V7z" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const PhoneOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A2 2 0 0 1 10.68 13.31z" />
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M10.68 13.31A16 16 0 0 1 7.27 9.9M6.26 6.26A16 16 0 0 0 3.07 8.63a2 2 0 0 0 .53 2.08l1.27 1.27" />
  </svg>
)
