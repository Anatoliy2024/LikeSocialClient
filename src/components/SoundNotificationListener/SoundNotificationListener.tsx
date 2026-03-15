"use client"

import { useEffect, useRef, useState } from "react"
import {
  // useAppDispatch,
  useAppSelector,
} from "@/store/hooks"
// import { getSocket } from "@/lib/socket"
import { useSound } from "@/hooks/useSound"
import { MessageType } from "@/types/conversation.types"
import { useSocket } from "@/providers/SocketProvider"
import style from "./SoundNotificationListener.module.scss"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import { getMessagePreview } from "@/utils/getMessagePreview"
// import {
//   addNotification,
//   updateNotification,
// } from "@/store/slices/notificationsSlice"
type NotificationType = Pick<
  MessageType,
  "conversationId" | "senderId" | "type" | "text"
>

export const SoundNotificationListener = () => {
  // const socket = getSocket()
  const socket = useSocket()
  // const dispatch = useAppDispatch()
  // 🔥 Получаем настройку звука из Redux
  const soundEnabled = useAppSelector((state) => state.settings.soundEnabled)
  const userId = useAppSelector((state) => state.auth.userId)
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // const [showNotification, setShowNotification] =
  //   useState<NotificationType | null>(null)
  // const items = useAppSelector((state) => state.notifications.items)

  const playNotification = useSound("/sounds/message.mp3", 0.6)

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data: { message: MessageType }) => {
      const messageData = data.message

      // 🔥 Проверяем настройку перед воспроизведением
      if (!soundEnabled) return

      const isOwnMessage = messageData.senderId?._id === userId
      if (isOwnMessage) return // Не играем для своих сообщений

      // 🔥 Дополнительная проверка: если пользователь уже в этом чате и видит его — звук не нужен
      // (опционально, можно убрать если хочешь звук всегда)
      //   const isCurrentChat = window.location.pathname.includes(
      //     `/conversation/${message.conversationId}`
      //   )
      //   const isDocumentVisible = document.visibilityState === "visible"

      //   if (isDocumentVisible) return
      //   if (isCurrentChat && isDocumentVisible) return

      playNotification()

      setNotifications((prev) => [
        ...prev,
        {
          conversationId: messageData.conversationId,
          senderId: messageData.senderId,
          type: messageData.type,
          text: messageData.text,
        },
      ])
    }

    socket.on("message:new", handleNewMessage)

    return () => {
      socket.off("message:new", handleNewMessage)
    }
  }, [socket, playNotification, soundEnabled, userId])

  useEffect(() => {
    if (notifications.length === 0) return
    if (timerRef.current) return // таймер уже запущен, ждём

    timerRef.current = setTimeout(() => {
      setNotifications((prev) => prev.slice(1))
      timerRef.current = null
    }, 3500)
  }, [notifications])

  return notifications.length > 0 ? (
    <div
      key={notifications[0].senderId._id + notifications[0].text}
      className={style.soundNotificationListener}
    >
      <div className={style.soundNotificationListener__imgBlock}>
        <CloudinaryImage
          src={
            notifications[0].conversationId?.type === "group"
              ? notifications[0].conversationId?.avatar
              : notifications[0].senderId.avatar
          }
          alt="avatar"
          width={100}
          height={100}
        />
      </div>
      <div>
        <div>{notifications[0].senderId.username}:</div>
        <div className={style.soundNotificationListener__text}>
          {notifications[0].type === "text" ? (
            <>{notifications[0].text}</>
          ) : (
            getMessagePreview(notifications[0].type)
          )}
        </div>
      </div>
    </div>
  ) : null
}
