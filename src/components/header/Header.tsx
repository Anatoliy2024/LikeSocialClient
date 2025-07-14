import Link from "next/link"
import style from "./header.module.scss"
import ArrowBottom from "@/assets/icons/arrowBottom"
import ButtonMenu from "../ui/button/Button"
// import Image from "next/image"
import { Notifications } from "../Notifications/Notifications"

import { initialStateNotificationsType } from "@/store/slices/notificationsSlice"
import { FireIcon } from "@/assets/icons/fireIcon"
import { NotificationIcon } from "@/assets/icons/notificationIcon"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
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
  notifications: initialStateNotificationsType
  deleteAllNotifications: () => void
  markAllNotificationsRead: () => void
  // handleShowNotification:() => void
  // handleCloseNotification:() => void
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
  notifications,
  deleteAllNotifications,
  markAllNotificationsRead,
}: // handleShowNotification,
// handleCloseNotification
HeaderData) {
  // console.log("avatar", avatar)
  return (
    <div className={style.wrapper}>
      <div className={style.logoWrapper}>
        <div>
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
            className={`${style.hamburger} ${
              menuOpen ? style.hamburgerOpen : ""
            }`}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        {isAuth && (
          <div className={style.containerNotification}>
            <button
              onClick={toggleShowNotification}
              className={style.toggleButton}
              style={{
                background: showNotifications
                  ? notifications.unreadCount > 0
                    ? "#ff7745"
                    : "#8f93da"
                  : "",
                color: showNotifications ? "#ffffff" : "",
              }}
            >
              {notifications.unreadCount > 0 ? (
                <div className={style.fireBlock}>
                  <FireIcon showNotifications={showNotifications} />
                  <div className={style.fireCountBlock}>
                    {notifications.unreadCount}
                  </div>
                </div>
              ) : (
                <NotificationIcon />
              )}
            </button>
            {showNotifications && (
              <Notifications
                toggleShowNotification={toggleShowNotification}
                notifications={notifications}
                deleteAllNotifications={deleteAllNotifications}
                markAllNotificationsRead={markAllNotificationsRead}
              />
            )}
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
              <CloudinaryImage
                src={avatar ? avatar : "/1.png"}
                alt="avatar"
                width={120}
                height={120}
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
