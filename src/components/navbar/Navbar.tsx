import Link from "next/link"
import style from "./navbar.module.scss"
import { RefObject } from "react"

export default function Navbar({
  isOpen,
  navRef,
  onClose,
}: {
  isOpen: boolean
  navRef: RefObject<HTMLDivElement | null>
  onClose: () => void
}) {
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
    </div>
  )
}
