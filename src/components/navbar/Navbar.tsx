"use client"
import Link from "next/link"
import style from "./navbar.module.scss"
// import {
//   RefObject,
//   //  useEffect, useState
// } from "react"
// import throttle from "lodash.throttle"
import { useAppSelector } from "@/store/hooks"
export default function Navbar({
  isOpen,
  // navRef,
  role,
  onClose,
}: {
  isOpen: boolean
  // navRef: RefObject<HTMLDivElement | null>
  role: "user" | "admin" | null
  onClose: () => void
}) {
  // const [showScrollTop, setShowScrollTop] = useState(false)
  const items = useAppSelector((state) => state.notifications.items)
  const countUnreadConversation = items.filter(
    (item) => !item.isRead && item.type === "newMessage",
  ).length
  // useEffect(() => {
  //   const handleScroll = throttle(() => {
  //     setShowScrollTop(window.scrollY > 100)
  //   }, 300)

  //   window.addEventListener("scroll", handleScroll)
  //   return () => window.removeEventListener("scroll", handleScroll)
  // }, [])

  // const scrollToTop = () => {
  //   window.scrollTo({ top: 0, behavior: "smooth" })
  // }

  const handleLinkClick = () => {
    const isMobile = window.innerWidth <= 768
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <ul
      // ref={navRef}
      className={`${style.navbar} ${!isOpen ? style.hidden : ""}`}
    >
      <li>
        <Link
          href="/profile"
          onClick={handleLinkClick}
          prefetch={false}
          className={style.navbar__item}
        >
          Profile
        </Link>
      </li>
      <li>
        <Link
          href="/rooms"
          onClick={handleLinkClick}
          prefetch={false}
          className={style.navbar__item}
        >
          Rooms
        </Link>
      </li>
      <li>
        <Link
          href="/conversations"
          onClick={handleLinkClick}
          prefetch={false}
          className={style.navbar__item}
        >
          <span>Messages</span>
          {countUnreadConversation > 0 && (
            <div className={style.navbar__notificationCount}>
              {countUnreadConversation}
            </div>
          )}
        </Link>
      </li>
      <li>
        <Link
          href="/friends"
          onClick={handleLinkClick}
          prefetch={false}
          className={style.navbar__item}
        >
          Friends
        </Link>
      </li>
      <li>
        <Link
          href="/userMovie"
          onClick={handleLinkClick}
          prefetch={false}
          className={style.navbar__item}
        >
          Want To See
        </Link>
      </li>

      {role === "admin" && (
        <li>
          <Link
            href="/admin"
            onClick={handleLinkClick}
            prefetch={false}
            className={style.navbar__item}
          >
            Admin
          </Link>
        </li>
      )}

      {/* {showScrollTop && (
        <button onClick={scrollToTop} className={style.scrollTopBtn}>
          ↑ Наверх
        </button>
      )} */}
    </ul>
  )
}
