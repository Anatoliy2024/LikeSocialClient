"use client"
import { useCallContext } from "@/providers/CallContext"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { useEffect, useRef, useState } from "react"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import styles from "./CallModal.module.scss"

// ---- Таймер длительности звонка ----
const useCallTimer = (active: boolean, startedAt: number | null) => {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!active || !startedAt) {
      setElapsed(0)
      return
    }
    setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [active, startedAt])

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0")
  const ss = String(elapsed % 60).padStart(2, "0")
  return `${mm}:${ss}`
}

// ---- Иконки (инлайн SVG чтобы не добавлять зависимость) ----
const IconMicOn = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm-1 1.93A5.001 5.001 0 0 1 7 11H5a7 7 0 0 0 6 6.93V20H9v2h6v-2h-2v-2.07A7 7 0 0 0 19 11h-2a5 5 0 0 1-4 4.93V15.9z" />
  </svg>
)

const IconMicOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
  </svg>
)

const IconVideoOn = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
  </svg>
)

const IconVideoOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 6.5l-4 4V7a1 1 0 0 0-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12c.2 0 .39-.08.53-.2l2.2 2.2L20 21.46 3.27 2zM15 17H5V8h1.46l8.54 8.54V17z" />
  </svg>
)

const IconEndCall = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
  </svg>
)

// ---- Аватар ----
interface AvatarRingProps {
  src: string | null
  alt: string
  size?: number
}

const AvatarRing = ({ src, alt, size = 96 }: AvatarRingProps) => {
  return (
    <div
      className={styles.avatarRingWrapper}
      style={{ width: size, height: size }}
    >
      <div className={styles.avatarInner} style={{ width: size, height: size }}>
        {src ? (
          <CloudinaryImage src={src} alt={alt} width={size} height={size} />
        ) : (
          <div className={styles.avatarFallback}>
            {alt.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Видео тайл ----
interface VideoTileProps {
  stream: MediaStream | null
  label: string
  muted?: boolean
}

const VideoTile = ({ stream, label, muted = false }: VideoTileProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.srcObject = stream ?? null
    if (stream) videoRef.current.play().catch(() => {})
  }, [stream])

  return (
    <div className={styles.videoTile}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className={styles.videoEl}
      />
      <span className={styles.videoLabel}>{label}</span>
    </div>
  )
}

// ---- Рингтон ----
const useRingtone = (
  status: string,
  outgoingSrc = "/sounds/calling.mp3",
  incomingSrc = "/sounds/incoming.mp3"
) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const stop = () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
    }

    if (status === "calling") {
      const a = new Audio(outgoingSrc)
      a.loop = true
      a.volume = 0.5
      a.play().catch(() => {})
      audioRef.current = a
    } else if (status === "incoming") {
      const a = new Audio(incomingSrc)
      a.loop = true
      a.volume = 0.7
      a.play().catch(() => {})
      audioRef.current = a
    } else {
      stop()
    }

    return stop
  }, [status, outgoingSrc, incomingSrc])
}

// ---- Основная модалка ----
export const CallModal = () => {
  const remoteAudioRef = useRef<HTMLAudioElement>(null)

  const {
    endCall,
    callAccept,
    remoteStream,
    localStream,
    loadingConnect,
    handleToggleAudio,
    handleToggleVideo,
  } = useCallContext()

  const {
    status,
    avatarCaller,
    usernameCaller,
    targetAvatar,
    targetUsername,
    isAudioEnabled,
    isVideoEnabled,
    callStartedAt,
    reconnectAttempt,
  } = useAppSelector((s: RootState) => s.call)

  const myAvatar = useAppSelector((s: RootState) => s.profile.avatar)
  const myName = useAppSelector((s: RootState) => s.profile.name)

  const timer = useCallTimer(status === "inCall", callStartedAt)

  // Рингтон
  useRingtone(status)

  // Удалённое аудио
  useEffect(() => {
    if (!remoteAudioRef.current) return
    remoteAudioRef.current.srcObject = remoteStream ?? null
    if (remoteStream)
      remoteAudioRef.current
        .play()
        .catch((e) => console.warn("Autoplay blocked:", e))
  }, [remoteStream])

  useEffect(() => {
    return () => {
      if (remoteAudioRef.current?.srcObject) {
        remoteAudioRef.current.srcObject = null
        remoteAudioRef.current.pause()
      }
    }
  }, [])

  // Если есть avatarCaller — значит нам звонят, иначе — мы звоним
  const peerAvatar = avatarCaller ?? targetAvatar
  const peerName = usernameCaller ?? targetUsername

  // Видео активно у кого-либо
  const hasLocalVideo = isVideoEnabled && !!localStream?.getVideoTracks().length
  const hasRemoteVideo = !!remoteStream?.getVideoTracks().find((t) => t.enabled)

  if (!status) return null

  return (
    <>
      {/* Скрытый audio для удалённого потока */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className={styles.overlay}>
        <div
          className={`${styles.modal} ${
            status === "inCall" ? styles.modalInCall : styles.modalRinging
          }`}
        >
          {/* ---- RINGING STATE (calling / incoming) ---- */}
          {(status === "calling" || status === "incoming") && (
            <div className={styles.ringingContent}>
              {/* Пульсирующие кольца */}
              <div className={styles.pulseRings}>
                <div
                  className={styles.pulseRing}
                  style={{ animationDelay: "0s" }}
                />
                <div
                  className={styles.pulseRing}
                  style={{ animationDelay: "0.4s" }}
                />
                <div
                  className={styles.pulseRing}
                  style={{ animationDelay: "0.8s" }}
                />
              </div>

              <AvatarRing
                src={peerAvatar}
                alt={peerName ?? "?"}
                // volume={0}
                size={120}
              />

              <div className={styles.peerName}>{peerName}</div>
              <div className={styles.callStatusText}>
                {status === "calling" ? "Calling..." : "Incoming call"}
              </div>

              <div className={styles.ringingActions}>
                {status === "incoming" && (
                  <button
                    className={`${styles.actionBtn} ${styles.acceptBtn}`}
                    onClick={callAccept}
                    disabled={loadingConnect}
                  >
                    {loadingConnect ? (
                      <span className={styles.spinner} />
                    ) : (
                      <IconMicOn />
                    )}
                    <span>Accept</span>
                  </button>
                )}
                <button
                  className={`${styles.actionBtn} ${styles.declineBtn}`}
                  onClick={endCall}
                >
                  <IconEndCall />
                  <span>{status === "calling" ? "Cancel" : "Decline"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ---- IN CALL STATE ---- */}
          {(status === "inCall" || status === "reconnecting") && (
            <div className={styles.inCallContent}>
              {/* Видео тайлы если есть видео */}
              {(hasLocalVideo || hasRemoteVideo) && (
                <div className={styles.videoGrid}>
                  {hasRemoteVideo && (
                    <VideoTile stream={remoteStream} label={peerName ?? ""} />
                  )}
                  {hasLocalVideo && (
                    <VideoTile
                      stream={localStream}
                      label={myName ?? "You"}
                      muted
                    />
                  )}
                </div>
              )}

              {/* Аватары с speaking indicator (если нет видео) */}
              {!hasLocalVideo && !hasRemoteVideo && (
                <div className={styles.avatarsRow}>
                  <div className={styles.avatarBlock}>
                    <AvatarRing
                      src={peerAvatar}
                      alt={peerName ?? "?"}
                      size={88}
                    />
                    <span className={styles.avatarLabel}>{peerName}</span>
                  </div>
                  <div className={styles.avatarBlock}>
                    <AvatarRing
                      src={myAvatar}
                      alt={myName ?? "You"}
                      size={88}
                    />
                    <span className={styles.avatarLabel}>
                      {myName ?? "You"}
                    </span>
                  </div>
                </div>
              )}

              {/* Статус / таймер */}
              <div className={styles.callInfo}>
                {status === "reconnecting" ? (
                  <span className={styles.reconnectText}>
                    Reconnecting... ({reconnectAttempt}/2)
                  </span>
                ) : (
                  <span className={styles.timer}>{timer}</span>
                )}
              </div>

              {/* Панель управления */}
              <div className={styles.controls}>
                <button
                  className={`${styles.ctrlBtn} ${
                    !isAudioEnabled ? styles.ctrlBtnOff : ""
                  }`}
                  onClick={handleToggleAudio}
                  title={isAudioEnabled ? "Mute" : "Unmute"}
                >
                  {isAudioEnabled ? <IconMicOn /> : <IconMicOff />}
                </button>

                <button
                  className={`${styles.ctrlBtn} ${styles.endCallBtn}`}
                  onClick={endCall}
                  title="End call"
                >
                  <IconEndCall />
                </button>

                <button
                  className={`${styles.ctrlBtn} ${
                    !isVideoEnabled ? styles.ctrlBtnOff : ""
                  }`}
                  onClick={handleToggleVideo}
                  title={isVideoEnabled ? "Stop video" : "Start video"}
                >
                  {isVideoEnabled ? <IconVideoOn /> : <IconVideoOff />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// import { useCallContext } from "@/providers/CallContext"
// import { useAppSelector } from "@/store/hooks"
// import { RootState } from "@/store/store"
// import ButtonMenu from "../ui/button/Button"
// import { useEffect, useRef } from "react"
// import style from "./CallModal.module.scss"
// import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
// export const CallModal = () => {
//   const remoteRef = useRef<HTMLAudioElement>(null)
//   const { endCall, callAccept, remoteStream, loadingConnect } = useCallContext()

//   const { status, callerId, targetId, avatarCaller, usernameCaller } =
//     useAppSelector((state: RootState) => state.call)
//   const avatar = useAppSelector((state: RootState) => state.profile.avatar)
//   const name = useAppSelector((state: RootState) => state.profile.name)

//   useEffect(() => {
//     if (!remoteRef.current) return

//     // Устанавливаем поток или null
//     remoteRef.current.srcObject = remoteStream ?? null

//     // Если есть поток, проигрываем
//     if (remoteStream) {
//       remoteRef.current.play().catch((err) => {
//         console.warn("⚠️ Autoplay blocked, waiting for interaction:", err)
//         // Можно показать пользователю кнопку "Включить звук"
//       })
//     }
//     // // Если есть поток, проигрываем
//     // if (remoteStream) {
//     //   remoteRef.current.play().catch(console.error)
//     // }
//   }, [remoteStream])

//   useEffect(() => {
//     return () => {
//       if (remoteRef.current?.srcObject) {
//         remoteRef.current.srcObject = null
//         remoteRef.current.pause()
//       }
//     }
//   }, [])

//   return (
//     <>
//       <audio ref={remoteRef} autoPlay playsInline />

//       <div className={style.wrapper}>
//         <div className={style.container}>
//           <div>{status}</div>
//           {callerId && (
//             <div className={style.infoCallBlock}>
//               <div className={style.imageContainer}>
//                 <CloudinaryImage
//                   src={avatarCaller || ""}
//                   alt="avatar"
//                   width={300}
//                   height={300}
//                 />
//               </div>
//               {usernameCaller}
//             </div>
//           )}
//           {targetId && (
//             <div className={style.infoCallBlock}>
//               <div className={style.imageContainer}>
//                 <CloudinaryImage
//                   src={avatar || ""}
//                   alt="avatar"
//                   width={300}
//                   height={300}
//                 />
//               </div>
//               {name}
//             </div>
//           )}
//           {status === "calling" && (
//             <ButtonMenu
//               onClick={() => {
//                 endCall()
//               }}
//             >
//               Отмена
//             </ButtonMenu>
//           )}
//           {status === "incoming" && (
//             <div className={style.buttonBlock}>
//               <ButtonMenu
//                 onClick={() => {
//                   callAccept()
//                 }}
//                 loading={loadingConnect}
//               >
//                 Принять
//               </ButtonMenu>
//               <ButtonMenu
//                 onClick={() => {
//                   endCall()
//                 }}
//               >
//                 Отказаться
//               </ButtonMenu>
//             </div>
//           )}
//           {status === "inCall" && (
//             <ButtonMenu
//               onClick={() => {
//                 endCall()
//               }}
//             >
//               завершить
//             </ButtonMenu>
//           )}
//         </div>
//       </div>
//     </>
//   )
// }
