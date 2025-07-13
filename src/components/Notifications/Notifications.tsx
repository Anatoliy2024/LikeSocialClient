// import { useEffect } from "react"
// import {
//   deleteAllNotificationsThunk,
//   fetchNotificationsThunk,
//   markAllNotificationsReadThunk,
// } from "@/store/thunks/notificationsThunk"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { RootState } from "@/store/store"
import { useEffect } from "react"
import ButtonMenu from "../ui/button/Button"
import style from "./Notifications.module.scss"
import { initialStateNotificationsType } from "@/store/slices/notificationsSlice"
import Image from "next/image"
import CloseButton from "../ui/closeButton/CloseButton"

export const Notifications = ({
  toggleShowNotification,
  notifications,
  deleteAllNotifications,
  markAllNotificationsRead,
}: {
  toggleShowNotification: () => void
  notifications: initialStateNotificationsType
  deleteAllNotifications: () => void
  markAllNotificationsRead: () => void
}) => {
  const { items, loading, unreadCount, error } = notifications

  useEffect(() => {
    // при монтировании — запрещаем прокрутку
    document.body.style.overflow = "hidden"

    // при размонтировании — возвращаем как было
    return () => {
      document.body.style.overflow = ""
    }
  }, [])
  console.log("items***", items)
  return (
    <div className={style.wrapper} onClick={toggleShowNotification}>
      <div className={style.container} onClick={(e) => e.stopPropagation()}>
        <div className={style.buttonCloseBlock}>
          <CloseButton onClick={toggleShowNotification} />
        </div>
        {/* <h2>Уведомления ({unreadCount})</h2> */}
        {unreadCount === 0 && <div>Новых уведомлений нет...</div>}
        {loading && <p>Загрузка...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <ul className={style.lists}>
          {items.map((n) => (
            <li
              key={n._id}
              style={{ color: n.isRead ? "green" : "white" }}
              className={style.list}
            >
              {n.senderId?.avatar && (
                <div className={style.imgBlockList}>
                  <Image
                    src={n.senderId.avatar}
                    alt="avatar"
                    width={20}
                    height={20}
                  />
                </div>
              )}
              <div className={style.message}>{n.message}</div>
            </li>
          ))}
        </ul>
        <div className={style.buttonBlock}>
          <ButtonMenu onClick={markAllNotificationsRead}>allRead</ButtonMenu>
          <ButtonMenu onClick={deleteAllNotifications}>allDell</ButtonMenu>
        </div>
      </div>
    </div>
  )
}
