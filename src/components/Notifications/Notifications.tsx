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
// import { initialStateNotificationsType } from "@/store/slices/notificationsSlice"
// import Image from "next/image"
import CloseButton from "../ui/closeButton/CloseButton"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"

import Link from "next/link"
import { RootState } from "@/store/store"
import { useAppSelector } from "@/store/hooks"

export const Notifications = ({
  toggleShowNotification,
  // notifications,
  deleteAllNotifications,
  markAllNotificationsRead,
}: {
  toggleShowNotification: () => void
  // notifications: initialStateNotificationsType
  deleteAllNotifications: () => void
  markAllNotificationsRead: () => void
}) => {
  const items = useAppSelector((state: RootState) => state.notifications.items)
  const loading = useAppSelector(
    (state: RootState) => state.notifications.loading,
  )
  const unreadCount = useAppSelector(
    (state: RootState) => state.notifications.unreadCount,
  )
  const error = useAppSelector((state: RootState) => state.notifications.error)
  // const { items, loading, unreadCount, error } = notifications

  useEffect(() => {
    // при монтировании — запрещаем прокрутку
    document.body.style.overflow = "hidden"

    // при размонтировании — возвращаем как было
    return () => {
      document.body.style.overflow = ""
    }
  }, [])
  // console.log("items***", items)
  return (
    <div className={style.notifications} onClick={toggleShowNotification}>
      <div
        className={style.notifications__container}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={style.notifications__buttonCloseBlock}>
          <CloseButton onClick={toggleShowNotification} />
        </div>
        {/* <h2>Уведомления ({unreadCount})</h2> */}
        {unreadCount === 0 && <div>Новых уведомлений нет...</div>}
        {loading && <p>Загрузка...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <ul className={style.lists}>
          {items.map((n) => {
            // const senderId =n.senderId._id
            // const conversationId =n.conversationId?._id
            // const isGroup = n.conversationId?.type === "group"
            // console.log(" n.conversationId?.type === group", n.conversationId)
            return (
              <li
                key={n._id}
                style={{ color: n.isRead ? "green" : "white" }}
                className={style.notifications__list}
              >
                {n.type === "newMessage" && (
                  <>
                    <Link
                      href={
                        n.conversationId?.type === "group"
                          ? `/conversation/${n.conversationId._id}`
                          : `/profile/${n.senderId._id}`
                      }
                      onClick={toggleShowNotification}
                    >
                      <div className={style.notifications__imgBlockList}>
                        <CloudinaryImage
                          src={
                            n.conversationId?.type === "group"
                              ? n.conversationId?.avatar
                              : n.senderId.avatar
                          }
                          alt="avatar"
                          width={100}
                          height={100}
                        />
                      </div>
                    </Link>
                    <div className={style.notifications__senderInfo}>
                      <span>{n.senderId.username}:</span>
                      <span>{n.count}</span>
                      <span>новых сообщения</span>
                    </div>
                  </>
                )}

                {n.senderId?.avatar && n.type !== "newMessage" && (
                  <Link
                    href={`/profile/${n.senderId._id}`}
                    onClick={toggleShowNotification}
                  >
                    <div className={style.notifications__imgBlockList}>
                      <CloudinaryImage
                        src={n.senderId.avatar}
                        alt="avatar"
                        width={80}
                        height={80}
                      />
                    </div>
                  </Link>
                  // <ProfileLink userId={n.senderId._id} currentUserId={userId}>

                  // </ProfileLink>
                )}
                {n.message && (
                  <div className={style.notifications__message}>
                    {n.message}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <div className={style.notifications__buttonBlock}>
          <ButtonMenu onClick={markAllNotificationsRead}>allRead</ButtonMenu>
          <ButtonMenu onClick={deleteAllNotifications}>allDell</ButtonMenu>
        </div>
      </div>
    </div>
  )
}
