"use client"
import { useEffect, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getStatusServerThunk } from "@/store/thunks/serverThunk"
import Navbar from "@/components/navbar/Navbar"
import HeaderContainer from "@/components/header/HeaderContainer"
import AuthProvider from "./AuthProvider"
import { ServerType } from "@/store/slices/serverSlice"
import { useTikServer } from "@/utils/useTikServer"
import { getSocket } from "@/lib/socket"

import style from "@/components/navbar/navbar.module.scss"
import { RootState } from "@/store/store"
import {
  setOnlineStatusList,
  updateUserStatus,
} from "@/store/slices/onlineStatusSlice"
import { addNotification } from "@/store/slices/notificationsSlice"
import { Loading } from "@/assets/loading/loading"
// import {
//   acceptCall,
//   clearIncomingCall,
//   setIncomingCall,
// } from "@/store/slices/callSlice"
// import ButtonMenu from "@/components/ui/button/Button"

// import { Socket } from "socket.io-client"
// import { useCall } from "@/hooks/useCall"
// import { useCallContext } from "./CallContext"
import { CallModal } from "@/components/CallModal/CallModal"

export default function InnerApp({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showButton, setShowButton] = useState(false)
  // const [socket, setSocket] = useState<Socket | null>(null)
  const navRef = useRef<HTMLDivElement | null>(null)

  const dispatch = useAppDispatch()
  const server = useAppSelector((state) => state.server) as ServerType
  const userId = useAppSelector((state: RootState) => state.auth.userId) // пример, где хранится user

  const status = useAppSelector((state: RootState) => state.call.status)

  // const {
  //   localStream,
  //   remoteStream,

  //   callAccept,
  //   endCall,
  //   // callerId,
  //   // targetId,
  //   // status,
  // } = useCall(userId)

  // const { endCall, callAccept, localStream, remoteStream } = useCallContext()

  // console.log("status", status)
  // const localRef = useRef<HTMLAudioElement>(null)
  // const remoteRef = useRef<HTMLAudioElement>(null)

  // useEffect(() => {
  //   if (localRef.current && localStream) {
  //     localRef.current.srcObject = localStream
  //     // localRef.current.play().catch(console.error)
  //   }
  // }, [localStream])

  // useEffect(() => {
  //   if (remoteRef.current && remoteStream) {
  //     remoteRef.current.srcObject = remoteStream
  //   }
  // }, [remoteStream])

  // useEffect(() => {
  //   if (remoteRef.current && remoteStream) {
  //     remoteRef.current.srcObject = remoteStream
  //     remoteRef.current.muted = false
  //     remoteRef.current.play().catch(console.error)
  //     console.log("remoteRef.current", remoteRef.current)
  //   }
  // }, [remoteStream])

  const handleShowToggleMenu = () => {
    setMenuOpen((prev) => !prev)
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 769px)")

    const handleChange = (e: MediaQueryListEvent) => {
      setMenuOpen(e.matches) // true — открыть, false — закрыть
      setShowButton(!e.matches)
    }

    // Установить состояние сразу при монтировании
    setMenuOpen(mediaQuery.matches)
    setShowButton(!mediaQuery.matches)

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    dispatch(getStatusServerThunk())
  }, [dispatch])

  useTikServer(server?.statusServer)

  useEffect(() => {
    if (!userId) return
    const token = localStorage.getItem("accessToken")
    if (!token) return
    const socket = getSocket(token)
    // if (!socket) return
    // setSocket(socket)
    socket.connect()

    socket.emit("user-connected", userId)
    socket.emit("get-online-users")

    socket.on("user-status-changed", ({ userId, status }) => {
      dispatch(updateUserStatus({ userId, status }))

      // обновляем локально статус этого пользователя
    })

    socket.on("online-users", (users) => {
      dispatch(setOnlineStatusList(users))
      console.log("Сейчас онлайн:", users)
      // Тут можешь диспатчить в стор, если хочешь хранить онлайн список
    })

    socket.on("new-notification", (notification) => {
      // например, добавить в Redux:
      dispatch(addNotification(notification))
      // или показать toast:
      // toast(notification.message)
    })

    return () => {
      socket.off("user-status-changed")
      socket.off("online-users")
      socket.off("new-notification")
    }
  }, [userId, dispatch])

  // useEffect(() => {
  //   if (localStream) {
  //     console.log("✅ localStream tracks:", localStream.getAudioTracks())
  //   }
  // }, [localStream])

  if (server?.loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
        }}
      >
        <div style={{ textAlign: "center" }}>
          Сервер просыпается, пожалуйста подождите...
        </div>
        <div>
          <Loading />
        </div>
      </div>
    )
  }

  if (server?.error) {
    return <div>Сервер не отвечает...</div>
  }
  // console.log(
  //   "console.log(localStream?.getAudioTracks());",
  //   localStream?.getAudioTracks()
  // )

  return (
    <AuthProvider>
      <div className="containerMain">
        <HeaderContainer
          handleShowToggleMenu={handleShowToggleMenu}
          showButton={showButton}
          menuOpen={menuOpen}
        />
        {/* 👉 Оверлей для мобильного меню */}
        {menuOpen && showButton && (
          <div className={style.overlay} onClick={() => setMenuOpen(false)} />
        )}
        <Navbar
          isOpen={menuOpen}
          navRef={navRef}
          onClose={() => setMenuOpen(false)}
        />

        <div className="content">{children}</div>
        {/* Локальный звук */}

        {/* <audio ref={localRef} autoPlay muted /> */}
        {/* <audio ref={remoteRef} autoPlay playsInline /> */}
        {
          status && <CallModal />
          // (
          //   <div
          //     style={{
          //       position: "fixed",
          //       top: 0,
          //       left: 0,
          //       minHeight: "100vh",
          //       minWidth: "100vw",
          //       background: "#394d3e80",
          //       display: "flex",
          //       justifyContent: "center",
          //       alignItems: "center",
          //     }}
          //   >
          //     <div style={{ background: "white", borderRadius: "20px" }}>
          //       <div>{status}</div>
          //       {callerId && <div>Кто:{callerId}</div>}
          //       {targetId && <div>кому:{targetId}</div>}
          //       {status === "calling" && (
          //         <ButtonMenu
          //           onClick={() => {
          //             endCall()
          //           }}
          //         >
          //           Отмена
          //         </ButtonMenu>
          //       )}
          //       {status === "incoming" && (
          //         <div>
          //           <ButtonMenu
          //             onClick={() => {
          //               callAccept()
          //             }}
          //           >
          //             Принять
          //           </ButtonMenu>
          //           <ButtonMenu
          //             onClick={() => {
          //               endCall()
          //             }}
          //           >
          //             Отказаться
          //           </ButtonMenu>
          //         </div>
          //       )}
          //       {status === "inCall" && (
          //         <ButtonMenu
          //           onClick={() => {
          //             endCall()
          //           }}
          //         >
          //           завершить
          //         </ButtonMenu>
          //       )}
          //     </div>
          //   </div>
          // )
        }
      </div>
    </AuthProvider>
  )
}
