import Link from "next/link"
import style from "./header.module.scss"
import ArrowBottom from "@/assets/icons/arrowBottom"
import ButtonMenu from "../ui/button/Button"
import Image from "next/image"
type HeaderData = {
  isAuth: boolean
  username: string | null
  avatar: string
  logoutFn: () => void
  handleShowToggleMenu: () => void
  showButton: boolean
  menuOpen: boolean
}

export default function Header({
  isAuth,
  username,
  avatar,
  logoutFn,
  handleShowToggleMenu,
  showButton,
  menuOpen,
}: HeaderData) {
  // console.log("avatar", avatar)
  return (
    <div className={style.wrapper}>
      <div className={style.logoWrapper}>
        <div>
          <Image src="/logo.png" alt="logo" width={40} height={40} />
        </div>
        {showButton && (
          <div
            onClick={handleShowToggleMenu}
            className={`${style.hamburger} ${
              menuOpen ? style.hamburgerOpen : ""
            }`}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        {/* {showButton && <button onClick={handleShowToggleMenu}>☰</button>} */}
      </div>
      {!isAuth && (
        <div className={style.blockAuth}>
          <Link href="/auth">
            <ButtonMenu>Sign in</ButtonMenu>
          </Link>
          <Link href="/register">
            <ButtonMenu>Register</ButtonMenu>
          </Link>
        </div>
      )}
      {isAuth && (
        <div className={style.profileWrapper}>
          <div className={style.profile}>
            {username}
            <div className={style.avatarBlock}>
              <Image
                src={avatar ? avatar : "/1.png"}
                alt="avatar"
                width={50}
                height={50}
              />
            </div>
            <ArrowBottom />
          </div>
          <div className={style.menu}>
            <button>Настройки</button>
            <button
              onClick={() => {
                logoutFn()
              }}
            >
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
