// components/PushNotificationStatus.tsx
import { usePushNotifications } from "@/hooks/usePushNotifications"

export function PushNotificationToggle() {
  const { isSubscribed, permission, subscribe } = usePushNotifications()

  // Проверяем, есть ли Google Services (грубая проверка для Android)
  const isAndroidWithoutGMS =
    /Android/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) // Упрощённо

  return (
    <div className="flex items-center gap-2">
      {isSubscribed ? (
        <span className="text-green-600 text-sm">🔔 Уведомления включены</span>
      ) : permission === "unsupported" || isAndroidWithoutGMS ? (
        <span
          className="text-gray-500 text-sm"
          title="На этом устройстве пуши недоступны"
        >
          🔔 Уведомления (недоступно)
        </span>
      ) : (
        <button
          onClick={subscribe}
          className="text-blue-600 text-sm hover:underline"
        >
          🔕 Включить уведомления
        </button>
      )}
    </div>
  )
}
// // components/PushNotificationToggle.tsx
// import { usePushNotifications } from "@/hooks/usePushNotifications"

// export function PushNotificationToggle() {
//   const { isSubscribed, loading, error, permission, subscribe, unsubscribe } =
//     usePushNotifications()

//   // 🎯 Определяем тип ошибки для пользователя
//   const getErrorMessage = () => {
//     if (!error) return null

//     if (error.includes("push service error")) {
//       return "Ваш браузер не поддерживает пуш-уведомления (возможно, отключены сервисы Google)."
//     }
//     if (permission === "denied") {
//       return "Уведомления заблокированы. Разрешите их в настройках браузера."
//     }
//     return error
//   }

//   // 🚫 Если браузер вообще не поддерживает Push API
//   if (permission === "unsupported") {
//     return (
//       <div className="text-sm text-gray-500" title="Push API не поддерживается">
//         🔔 Уведомления
//       </div>
//     )
//   }

//   return (
//     <div className="flex items-center gap-2">
//       <button
//         onClick={isSubscribed ? unsubscribe : subscribe}
//         disabled={loading}
//         className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
//           ${
//             isSubscribed
//               ? "bg-red-100 text-red-700 hover:bg-red-200"
//               : "bg-blue-100 text-blue-700 hover:bg-blue-200"
//           } ${loading ? "opacity-50 cursor-not-allowed" : ""}
//         `}
//       >
//         {loading
//           ? "Подключение..."
//           : isSubscribed
//             ? "🔔 Отключить"
//             : "🔕 Включить уведомления"}
//       </button>

//       {/* 🚨 Показываем понятную ошибку, если она есть */}
//       {error && (
//         <span className="text-xs text-red-500 max-w-[200px]" title={error}>
//           ⚠️ {getErrorMessage()}
//         </span>
//       )}
//     </div>
//   )
// }
