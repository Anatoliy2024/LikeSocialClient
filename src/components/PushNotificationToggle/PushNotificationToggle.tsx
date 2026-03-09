// components/PushNotificationToggle.tsx
import { usePushNotifications } from "@/hooks/usePushNotifications"

export function PushNotificationToggle() {
  const { isSubscribed, loading, error, permission, subscribe, unsubscribe } =
    usePushNotifications()

  // 🎯 Определяем тип ошибки для пользователя
  const getErrorMessage = () => {
    if (!error) return null

    if (error.includes("push service error")) {
      return "Ваш браузер не поддерживает пуш-уведомления (возможно, отключены сервисы Google)."
    }
    if (permission === "denied") {
      return "Уведомления заблокированы. Разрешите их в настройках браузера."
    }
    return error
  }

  // 🚫 Если браузер вообще не поддерживает Push API
  if (permission === "unsupported") {
    return (
      <div className="text-sm text-gray-500" title="Push API не поддерживается">
        🔔 Уведомления
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={loading}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
          ${
            isSubscribed
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {loading
          ? "Подключение..."
          : isSubscribed
            ? "🔔 Отключить"
            : "🔕 Включить уведомления"}
      </button>

      {/* 🚨 Показываем понятную ошибку, если она есть */}
      {error && (
        <span className="text-xs text-red-500 max-w-[200px]" title={error}>
          ⚠️ {getErrorMessage()}
        </span>
      )}
    </div>
  )
}

// // components/PushNotificationToggle.tsx
// "use client"
// import { usePushNotifications } from "@/hooks/usePushNotifications"

// export function PushNotificationToggle() {
//   const { isSubscribed, loading, error, permission, subscribe, unsubscribe } =
//     usePushNotifications()

//   const handleToggle = async () => {
//     if (isSubscribed) {
//       await unsubscribe()
//     } else {
//       await subscribe()
//     }
//   }

//   if (permission === "unsupported") {
//     return <span>Уведомления не поддерживаются</span>
//   }

//   return (
//     <button onClick={handleToggle} disabled={loading}>
//       {loading
//         ? "Загрузка..."
//         : isSubscribed
//           ? "🔔 Отключить уведомления"
//           : "🔕 Включить уведомления"}
//     </button>
//   )
// }
