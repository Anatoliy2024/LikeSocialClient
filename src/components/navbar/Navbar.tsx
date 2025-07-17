"use client"
import Link from "next/link"
import style from "./navbar.module.scss"
import { RefObject, useEffect, useState } from "react"
import throttle from "lodash.throttle"
export default function Navbar({
  isOpen,
  navRef,
  onClose,
}: {
  isOpen: boolean
  navRef: RefObject<HTMLDivElement | null>
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
      <Link href="/profile" onClick={handleLinkClick}>
        <div>Profile</div>
      </Link>
      <Link href="/rooms" onClick={handleLinkClick}>
        <div>Rooms</div>
      </Link>
      <Link href="/dialogs" onClick={handleLinkClick}>
        <div>Dialogs</div>
      </Link>
      <Link href="/friends" onClick={handleLinkClick}>
        <div>Friends</div>
      </Link>
      <Link href="/userMovie" onClick={handleLinkClick}>
        <div>Want To See</div>
      </Link>

      {showScrollTop && (
        <button onClick={scrollToTop} className={style.scrollTopBtn}>
          ↑ Наверх
        </button>
      )}
    </div>
  )
}
