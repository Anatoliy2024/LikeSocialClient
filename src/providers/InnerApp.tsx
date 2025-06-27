"use client"
import { useEffect, useRef, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getStatusServerThunk } from "@/store/thunks/serverThunk"
import Navbar from "@/components/navbar/Navbar"
import HeaderContainer from "@/components/header/HeaderContainer"
import AuthProvider from "./AuthProvider"
import { ServerType } from "@/store/slices/serverSlice"
import { useTikServer } from "@/utils/useTikServer"
import style from "@/components/navbar/navbar.module.scss"
export default function InnerApp({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const server = useAppSelector((state) => state.server) as ServerType
  const [menuOpen, setMenuOpen] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const navRef = useRef<HTMLDivElement | null>(null)
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

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    dispatch(getStatusServerThunk())
  }, [dispatch])

  useTikServer(server?.statusServer)
  if (server?.loading) {
    return <div>Сервер просыпается, пожалуйста подождите...</div>
  }

  if (server?.error) {
    return <div>Сервер не отвечает...</div>
  }

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
      </div>
    </AuthProvider>
  )
}
