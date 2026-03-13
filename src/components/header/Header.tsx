import Link from "next/link"
import style from "./header.module.scss"
import ArrowBottom from "@/assets/icons/arrowBottom"
import ButtonMenu from "../ui/button/Button"
// import Image from "next/image"
import { Notifications } from "../Notifications/Notifications"

// import { initialStateNotificationsType } from "@/store/slices/notificationsSlice"
import { FireIcon } from "@/assets/icons/fireIcon"
import { NotificationIcon } from "@/assets/icons/notificationIcon"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
type HeaderData = {
  isAuth: boolean

  username: string | null
  avatar: string
  logoutFn: () => void
  handleShowToggleMenu: () => void
  showButton: boolean
  menuOpen: boolean
  showNotifications: boolean
  toggleShowNotification: () => void
  // notifications: initialStateNotificationsType
  deleteAllNotifications: () => void
  markAllNotificationsRead: () => void
}

export default function Header({
  isAuth,

  username,
  avatar,
  logoutFn,
  handleShowToggleMenu,
  showButton,
  menuOpen,
  showNotifications,
  toggleShowNotification,
  // notifications,
  deleteAllNotifications,
  markAllNotificationsRead,
}: // showHeader,
// handleShowNotification,
// handleCloseNotification
HeaderData) {
  // console.log("avatar", avatar)
  const notificationsUnreadCount = useAppSelector(
    (state: RootState) => state.notifications.unreadCount,
  )

  return (
    <div className={style.header}>
      <div className={style.header__logoWrapper}>
        <div className={style.header__logoWrapperImage}>
          <Link href="/">
            <CloudinaryImage
              src="/logo.png"
              alt="logo"
              width={120}
              height={120}
            />
          </Link>
        </div>
        {showButton && (
          <div
            onClick={handleShowToggleMenu}
            className={`${style.header__hamburger} ${
              menuOpen ? style.header__hamburgerOpen : ""
            }`}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        {isAuth && (
          <div className={style.header__containerNotification}>
            <button
              onClick={toggleShowNotification}
              className={style.header__toggleButton}
              style={{
                background: showNotifications
                  ? notificationsUnreadCount > 0
                    ? "#ff7745"
                    : "#8f93da"
                  : "",
                color: showNotifications ? "#ffffff" : "",
              }}
            >
              {notificationsUnreadCount > 0 ? (
                <div className={style.header__fireBlock}>
                  <FireIcon showNotifications={showNotifications} />
                  <div className={style.header__fireCountBlock}>
                    {notificationsUnreadCount}
                  </div>
                </div>
              ) : (
                <NotificationIcon />
              )}
            </button>
            {showNotifications && (
              <Notifications
                toggleShowNotification={toggleShowNotification}
                // notifications={notifications}
                deleteAllNotifications={deleteAllNotifications}
                markAllNotificationsRead={markAllNotificationsRead}
              />
            )}
          </div>
        )}
        {/* {showButton && <button onClick={handleShowToggleMenu}>☰</button>} */}
      </div>
      {!isAuth && (
        <div className={style.header__blockAuth}>
          <Link href="/auth">
            <ButtonMenu>Sign in</ButtonMenu>
          </Link>
          <Link href="/register">
            <ButtonMenu>Register</ButtonMenu>
          </Link>
        </div>
      )}
      {isAuth && (
        <div className={style.header__profileWrapper}>
          <div className={style.header__profile}>
            <div className={style.header__userNameBlock}>{username}</div>
            <div className={style.header__avatarBlock}>
              <CloudinaryImage
                src={avatar ? avatar : "/1.png"}
                alt="avatar"
                width={120}
                height={120}
              />
            </div>
            <ArrowBottom />
          </div>
          <div className={style.header__menu}>
            <button>
              <Link href={"/user-options"}>Настройки</Link>
            </button>
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
