// components/PushNotification/PushNotification.tsx
"use client"

import { useEffect } from "react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { DevicesList } from "../DevicesList/DevicesList"
import style from "./PushNotification.module.scss"

export function PushNotification() {
  const {
    permission,
    isSubscribed,
    loading,
    error,
    canSubscribe,
    subscribe,
    refreshPermission,
  } = usePushNotifications()

  // Обновляем permission когда пользователь возвращается на вкладку
  // Например: ушёл в настройки браузера, включил уведомления, вернулся
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

  // Проверка Android без Google Services (без сети пуши не работают)
  const isAndroidWithoutGMS =
    typeof window !== "undefined" &&
    /Android/.test(navigator.userAgent) &&
    !/Chrome/.test(navigator.userAgent)

  const isUnavailable = permission === "unsupported" || isAndroidWithoutGMS

  return (
    <div className={style.pushNotification}>
      <h2>Уведомления</h2>

      {/* Статус */}
      {isSubscribed ? (
        <div className={style.pushNotification__activeNotification}>
          🔔 Уведомления включены
        </div>
      ) : (
        <div className={style.pushNotification__closeNotification}>
          🔕 Уведомления не включены
        </div>
      )}

      {/* Недоступно на устройстве */}
      {isUnavailable && (
        <span
          className={style.pushNotification__unsupportedNotification}
          title="На этом устройстве пуши недоступны"
        >
          ⚠️ Уведомления недоступны на этом устройстве
        </span>
      )}

      {/* Заблокировано в браузере */}
      {permission === "denied" && (
        <span className={style.pushNotification__deniedNotification}>
          🚫 Уведомления заблокированы в настройках браузера
        </span>
      )}

      {/* Ошибка */}
      {error && (
        <span className={style.pushNotification__error}>⚠️ {error}</span>
      )}

      {/* Кнопка подписки — только если можно подписаться */}
      {canSubscribe && !isUnavailable && (
        <button
          onClick={subscribe}
          disabled={loading}
          className={style.pushNotification__buttonActiveNotification}
        >
          {loading ? "Подключение..." : "Включить уведомления"}
        </button>
      )}

      <DevicesList />
    </div>
  )
}

// // components/PushNotificationStatus.tsx
// import { usePushNotifications } from "@/hooks/usePushNotifications"
// import { DevicesList } from "../DevicesList/DevicesList"
// import style from "./PushNotification.module.scss"
// import { useAppSelector } from "@/store/hooks"
// import { RootState } from "@/store/store"
// export function PushNotification() {
//   const { subscribe } = usePushNotifications()
//   const permission = useAppSelector(
//     (root: RootState) => root.pushNotifications.permission,
//   )
//   const isSubscribed = useAppSelector(
//     (root: RootState) => root.pushNotifications.isSubscribed,
//   )

//   // Проверяем, есть ли Google Services (грубая проверка для Android)
//   const isAndroidWithoutGMS =
//     /Android/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) // Упрощённо

//   return (
//     <div className={style.pushNotification}>
//       <h2>Уведомления: </h2>
//       {isSubscribed ? (
//         <div className={style.pushNotification__activeNotification}>
//           🔔 Уведомления включены
//         </div>
//       ) : (
//         <div className={style.pushNotification__closeNotification}>
//           🔔 Уведомления не включены
//         </div>
//       )}
//       {permission === "unsupported" ||
//         (isAndroidWithoutGMS && (
//           <span
//             className={style.pushNotification__unsupportedNotification}
//             title="На этом устройстве пуши недоступны"
//           >
//             🔔 Уведомления (недоступно)
//           </span>
//         ))}

//       <button
//         onClick={subscribe}
//         className={style.pushNotification__buttonActiveNotification}
//       >
//         Включить уведомления
//       </button>
//       <DevicesList />
//     </div>
//   )
// }
// // // components/PushNotificationToggle.tsx
// // import { usePushNotifications } from "@/hooks/usePushNotifications"

// // export function PushNotificationToggle() {
// //   const { isSubscribed, loading, error, permission, subscribe, unsubscribe } =
// //     usePushNotifications()

// //   // 🎯 Определяем тип ошибки для пользователя
// //   const getErrorMessage = () => {
// //     if (!error) return null

// //     if (error.includes("push service error")) {
// //       return "Ваш браузер не поддерживает пуш-уведомления (возможно, отключены сервисы Google)."
// //     }
// //     if (permission === "denied") {
// //       return "Уведомления заблокированы. Разрешите их в настройках браузера."
// //     }
// //     return error
// //   }

// //   // 🚫 Если браузер вообще не поддерживает Push API
// //   if (permission === "unsupported") {
// //     return (
// //       <div className="text-sm text-gray-500" title="Push API не поддерживается">
// //         🔔 Уведомления
// //       </div>
// //     )
// //   }

// //   return (
// //     <div className="flex items-center gap-2">
// //       <button
// //         onClick={isSubscribed ? unsubscribe : subscribe}
// //         disabled={loading}
// //         className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
// //           ${
// //             isSubscribed
// //               ? "bg-red-100 text-red-700 hover:bg-red-200"
// //               : "bg-blue-100 text-blue-700 hover:bg-blue-200"
// //           } ${loading ? "opacity-50 cursor-not-allowed" : ""}
// //         `}
// //       >
// //         {loading
// //           ? "Подключение..."
// //           : isSubscribed
// //             ? "🔔 Отключить"
// //             : "🔕 Включить уведомления"}
// //       </button>

// //       {/* 🚨 Показываем понятную ошибку, если она есть */}
// //       {error && (
// //         <span className="text-xs text-red-500 max-w-[200px]" title={error}>
// //           ⚠️ {getErrorMessage()}
// //         </span>
// //       )}
// //     </div>
// //   )
// // }
