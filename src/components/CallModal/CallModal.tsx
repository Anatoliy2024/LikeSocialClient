import { useCallContext } from "@/providers/CallContext"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import ButtonMenu from "../ui/button/Button"
import { useEffect, useRef } from "react"
import style from "./CallModal.module.scss"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
export const CallModal = () => {
  const remoteRef = useRef<HTMLAudioElement>(null)
  const { endCall, callAccept, remoteStream, loadingConnect } = useCallContext()

  const { status, callerId, targetId, avatarCaller, usernameCaller } =
    useAppSelector((state: RootState) => state.call)
  const avatar = useAppSelector((state: RootState) => state.profile.avatar)
  const name = useAppSelector((state: RootState) => state.profile.name)

  useEffect(() => {
    if (!remoteRef.current) return

    // Устанавливаем поток или null
    remoteRef.current.srcObject = remoteStream ?? null

    // Если есть поток, проигрываем
    if (remoteStream) {
      remoteRef.current.play().catch((err) => {
        console.warn("⚠️ Autoplay blocked, waiting for interaction:", err)
        // Можно показать пользователю кнопку "Включить звук"
      })
    }
    // // Если есть поток, проигрываем
    // if (remoteStream) {
    //   remoteRef.current.play().catch(console.error)
    // }
  }, [remoteStream])

  useEffect(() => {
    return () => {
      if (remoteRef.current?.srcObject) {
        remoteRef.current.srcObject = null
        remoteRef.current.pause()
      }
    }
  }, [])

  return (
    <>
      <audio ref={remoteRef} autoPlay playsInline />

      <div className={style.wrapper}>
        <div className={style.container}>
          <div>{status}</div>
          {callerId && (
            <div className={style.infoCallBlock}>
              <div className={style.imageContainer}>
                <CloudinaryImage
                  src={avatarCaller || ""}
                  alt="avatar"
                  width={300}
                  height={300}
                />
              </div>
              {usernameCaller}
            </div>
          )}
          {targetId && (
            <div className={style.infoCallBlock}>
              <div className={style.imageContainer}>
                <CloudinaryImage
                  src={avatar || ""}
                  alt="avatar"
                  width={300}
                  height={300}
                />
              </div>
              {name}
            </div>
          )}
          {status === "calling" && (
            <ButtonMenu
              onClick={() => {
                endCall()
              }}
            >
              Отмена
            </ButtonMenu>
          )}
          {status === "incoming" && (
            <div className={style.buttonBlock}>
              <ButtonMenu
                onClick={() => {
                  callAccept()
                }}
                loading={loadingConnect}
              >
                Принять
              </ButtonMenu>
              <ButtonMenu
                onClick={() => {
                  endCall()
                }}
              >
                Отказаться
              </ButtonMenu>
            </div>
          )}
          {status === "inCall" && (
            <ButtonMenu
              onClick={() => {
                endCall()
              }}
            >
              завершить
            </ButtonMenu>
          )}
        </div>
      </div>
    </>
  )
}
