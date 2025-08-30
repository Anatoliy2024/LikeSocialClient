import { useCallContext } from "@/providers/CallContext"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import ButtonMenu from "../ui/button/Button"
import { useEffect, useRef } from "react"
import style from "./CallModal.module.scss"
export const CallModal = () => {
  const remoteRef = useRef<HTMLAudioElement>(null)
  const { endCall, callAccept, remoteStream } = useCallContext()

  const { status, callerId, targetId } = useAppSelector(
    (state: RootState) => state.call
  )

  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream
      remoteRef.current.muted = false
      remoteRef.current.play().catch(console.error)
      console.log("remoteRef.current", remoteRef.current)
    }
  }, [remoteStream])

  return (
    <>
      <audio ref={remoteRef} autoPlay playsInline />

      <div
        className={style.wrapper}
        // style={{
        //   position: "fixed",
        //   top: 0,
        //   left: 0,
        //   minHeight: "100vh",
        //   minWidth: "100vw",
        //   background: "#394d3e80",
        //   display: "flex",
        //   justifyContent: "center",
        //   alignItems: "center",
        // }}
      >
        <div className={style.container}>
          <div>{status}</div>
          {callerId && <div>Кто:{callerId}</div>}
          {targetId && <div>кому:{targetId}</div>}
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
