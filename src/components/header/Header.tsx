import Link from "next/link"
import style from "./header.module.scss"
import ArrowBottom from "@/assets/icons/arrowBottom"
import ButtonMenu from "../ui/button/Button"
import Image from "next/image"
type HeaderData = {
  isAuth: boolean
  username: string | null
  avatar: string | null | undefined
  logoutFn: () => void
}

export default function Header({
  isAuth,
  username,
  avatar,
  logoutFn,
}: HeaderData) {
  console.log("avatar", avatar)
  return (
    <div className={style.wrapper}>
      <div className={style.logoWrapper}>
        <div>
          <Image src="/logo.png" alt="logo" width={40} height={40} />
        </div>
        <div>burger</div>
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
            <Image
              src={avatar ? avatar : "/1.png"}
              alt="avatar"
              width={50}
              height={50}
            />
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
