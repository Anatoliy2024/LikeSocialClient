"use client"

import { usePushNotifications } from "@/hooks/usePushNotifications"
import ReduxProvider from "./ReduxProvider"
import { useEffect } from "react"

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSubscribed, subscription, permission, refreshPermission } =
    usePushNotifications()

  // 🔁 Эффект: при загрузке страницы, если подписка есть — можно отправить её на сервер для синхронизации
  useEffect(() => {
    // Если у пользователя уже есть активная подписка и разрешение — убеждаемся, что сервер в курсе
    if (isSubscribed && subscription && permission === "granted") {
      // Опционально: можно раскомментировать, если хотите гарантировать синхронизацию при каждом заходе
      // api.savePushSubscription(subscription).catch(err => {
      //   console.warn('Не удалось синхронизировать подписку при загрузке:', err)
      // })
    }
  }, [isSubscribed, subscription, permission])

  // 🔁 Слушаем изменение видимости страницы (пользователь вернулся на вкладку)
  // Это поможет «подтянуть» статус, если пользователь включил уведомления в настройках браузера
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshPermission()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [refreshPermission])
  return <ReduxProvider>{children}</ReduxProvider>
}
