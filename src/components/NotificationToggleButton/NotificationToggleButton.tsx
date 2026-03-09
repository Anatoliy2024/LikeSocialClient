// components/NotificationToggleButton.tsx
"use client"

import { useNotification } from "@/hooks/useNotification"

export default function NotificationToggleButton() {
  const { permission, loading, isReady, requestPermission } = useNotification()

  // 🔥 Пока не смонтировался — ничего не рендерим (защита от гидратации)
  if (!isReady) return null

  // 🔥 Если разрешение уже получено или заблокировано — кнопка не нужна
  if (permission !== "default") return null

  return (
    <button
      onClick={requestPermission}
      disabled={loading}
      className="text-sm text-blue-600 hover:underline disabled:opacity-50"
      aria-label="Включить пуш-уведомления"
    >
      {loading ? "⏳ Подключение..." : "🔔 Включить уведомления"}
    </button>
  )
}
