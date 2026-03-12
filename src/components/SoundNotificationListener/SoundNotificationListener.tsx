"use client"

import { useEffect } from "react"
import { useAppSelector } from "@/store/hooks"
// import { getSocket } from "@/lib/socket"
import { useSound } from "@/hooks/useSound"
import { MessageType } from "@/types/conversation.types"
import { useSocket } from "@/providers/SocketProvider"

export const SoundNotificationListener = () => {
  // const socket = getSocket()
  const socket = useSocket()

  // 🔥 Получаем настройку звука из Redux
  const soundEnabled = useAppSelector((state) => state.settings.soundEnabled)
  const userId = useAppSelector((state) => state.auth.userId)

  const playNotification = useSound("/sounds/message.mp3", 0.6)

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data: { message: MessageType }) => {
      const message = data.message

      // 🔥 Проверяем настройку перед воспроизведением
      if (!soundEnabled) return

      const isOwnMessage = message.senderId?._id === userId
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
    }

    socket.on("message:new", handleNewMessage)

    return () => {
      socket.off("message:new", handleNewMessage)
    }
  }, [socket, playNotification, soundEnabled, userId])

  return null
}
