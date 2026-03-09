// // components/NotificationToggleButton.tsx
// "use client"

// import { useNotification } from "@/hooks/useNotification"
// import style from "./NotificationToggleButton.module.scss"
// export default function NotificationToggleButton() {
//   const { permission, loading, isReady, requestPermission } = useNotification()

//   // 🔥 Пока не смонтировался — ничего не рендерим (защита от гидратации)
//   if (!isReady) return null

//   // 🔥 Если разрешение уже получено или заблокировано — кнопка не нужна
//   if (permission !== "default") return null

//   return (
//     <button
//       onClick={requestPermission}
//       disabled={loading}
//       className={style.notificationToggleButton}
//       aria-label="Включить пуш-уведомления"
//     >
//       {loading ? "⏳ Подключение..." : "🔔 Включить уведомления"}
//     </button>
//   )
// }
