"use client"
import Link from "next/link"
import style from "./navbar.module.scss"
import { RefObject, useEffect, useState } from "react"
import throttle from "lodash.throttle"
export default function Navbar({
  isOpen,
  navRef,
  role,
  onClose,
}: {
  isOpen: boolean
  navRef: RefObject<HTMLDivElement | null>
  role: "user" | "admin" | null
  onClose: () => void
}) {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = throttle(() => {
      setShowScrollTop(window.scrollY > 100)
    }, 300)

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleLinkClick = () => {
    const isMobile = window.innerWidth <= 768
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <div
      ref={navRef}
      className={`${style.wrapper} ${!isOpen ? style.hidden : ""}`}
    >
      <Link href="/profile" onClick={handleLinkClick} prefetch={false}>
        <div>Profile</div>
      </Link>
      <Link href="/rooms" onClick={handleLinkClick} prefetch={false}>
        <div>Rooms</div>
      </Link>
      <Link href="/conversations" onClick={handleLinkClick} prefetch={false}>
        <div>Messages</div>
      </Link>
      <Link href="/friends" onClick={handleLinkClick} prefetch={false}>
        <div>Friends</div>
      </Link>
      <Link href="/userMovie" onClick={handleLinkClick} prefetch={false}>
        <div>Want To See</div>
      </Link>
      {role === "admin" && (
        <Link href="/admin" onClick={handleLinkClick} prefetch={false}>
          <div>Admin</div>
        </Link>
      )}

      {showScrollTop && (
        <button onClick={scrollToTop} className={style.scrollTopBtn}>
          ↑ Наверх
        </button>
      )}
    </div>
  )
}
