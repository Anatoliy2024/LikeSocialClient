"use client"
import { useEffect, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getStatusServerThunk } from "@/store/thunks/serverThunk"
import Navbar from "@/components/navbar/Navbar"
import HeaderContainer from "@/components/header/HeaderContainer"
import AuthProvider from "./AuthProvider"
import { ServerType } from "@/store/slices/serverSlice"
import { useTikServer } from "@/utils/useTikServer"
// import { destroySocket, getSocket } from "@/lib/socket"

import style from "@/components/navbar/navbar.module.scss"
import { RootState } from "@/store/store"
// import {
//   setOnlineStatusList,
//   updateUserStatus,
// } from "@/store/slices/onlineStatusSlice"
// import { addNotification } from "@/store/slices/notificationsSlice"
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
import { GroupCallProvider } from "./GroupCallProvider"
import { GroupCallPanel } from "@/components/GroupCallPanel/GroupCallPanel"
// import { addMessageFromSocket } from "@/store/slices/conversationsSlice"

const TIMER = 30

export default function InnerApp({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [timerCount, setTimerCount] = useState(TIMER)
  // const [socket, setSocket] = useState<Socket | null>(null)
  const navRef = useRef<HTMLDivElement | null>(null)
  const countRef = useRef<number>(0)

  const dispatch = useAppDispatch()
  const server = useAppSelector((state) => state.server) as ServerType
  // const userId = useAppSelector((state: RootState) => state.auth.userId) // пример, где хранится user
  const role = useAppSelector((state: RootState) => state.auth.role) // пример, где хранится user

  const status = useAppSelector((state: RootState) => state.call.status)
  // const callActive = useAppSelector((state: RootState) => !!state.call.status)

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
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  //Таймер включения сервера
  useEffect(() => {
    if (timerCount === 0) {
      countRef.current++
      if (countRef.current === 2) return
      setTimerCount(TIMER)
    }

    const intervalId = setTimeout(() => {
      setTimerCount((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [timerCount, countRef])

  useEffect(() => {
    dispatch(getStatusServerThunk())
  }, [dispatch])

  useTikServer(server?.statusServer)

  // useEffect(() => {
  //   if (!userId) {
  //     destroySocket()
  //     return
  //   }
  //   const token = localStorage.getItem("accessToken")
  //   if (!token) return
  //   const socket = getSocket(token)
  //   // if (!socket) return
  //   // setSocket(socket)
  //   socket.connect()

  //   socket.emit("user-connected", userId)
  //   socket.emit("get-online-users")

  //   socket.on("user-status-changed", ({ userId, status }) => {
  //     dispatch(updateUserStatus({ userId, status }))

  //     // обновляем локально статус этого пользователя
  //   })

  //   socket.on("online-users", (users) => {
  //     dispatch(setOnlineStatusList(users))
  //     console.log("Сейчас онлайн:", users)
  //     // Тут можешь диспатчить в стор, если хочешь хранить онлайн список
  //   })

  //   socket.on("new-notification", (notification) => {
  //     // например, добавить в Redux:
  //     dispatch(addNotification(notification))
  //     // или показать toast:
  //     // toast(notification.message)
  //   })

  //   return () => {
  //     socket.off("user-status-changed")
  //     socket.off("online-users")
  //     socket.off("new-notification")

  //     // socket.disconnect()
  //   }
  // }, [userId, dispatch])

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
          {timerCount > 0 && countRef.current === 0 && (
            <div>Сервер просыпается, пожалуйста подождите: {timerCount}...</div>
          )}
          {timerCount > 0 && countRef.current === 1 && (
            <div>Разбираемся c причиной задержки: {timerCount}...</div>
          )}
          {timerCount === 0 && <div>Подключаем дополнительные мощности...</div>}
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

  return (
    <AuthProvider>
      <GroupCallProvider>
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
            role={role}
            onClose={() => setMenuOpen(false)}
          />

          <div className="content">{children}</div>

          {status && <CallModal />}
          <GroupCallPanel />
        </div>
      </GroupCallProvider>
    </AuthProvider>
  )
}
