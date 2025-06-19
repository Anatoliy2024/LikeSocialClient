import Link from "next/link"
import style from "./navbar.module.scss"

export default function Navbar() {
  return (
    <div className={style.wrapper}>
      <Link href="/profile">
        <div>Profile</div>
      </Link>
      <Link href="/rooms">
        <div>Rooms</div>
      </Link>
      <Link href="/dialogs">
        <div>Dialogs</div>
      </Link>
      <Link href="/friends">
        <div>Friends</div>
      </Link>
      <Link href="/wantToSee">
        <div>Want To See</div>
      </Link>
    </div>
  )
}
