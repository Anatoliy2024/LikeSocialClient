// components/DevicesList/DevicesList.tsx
"use client"

import { usePushNotifications } from "@/hooks/usePushNotifications"
import style from "./DevicesList.module.scss"
import { useEffect } from "react"

export function DevicesList() {
  const { devices, loading, error, removeDevice, browserSubscription, init } =
    usePushNotifications()

  const handleDelete = async (deviceId: string, endpoint: string) => {
    const isCurrent = browserSubscription?.endpoint === endpoint

    const confirmed = window.confirm(
      isCurrent
        ? "Удалить текущее устройство? Уведомления перестанут приходить."
        : "Удалить это устройство из списка?",
    )
    if (!confirmed) return

    await removeDevice(deviceId, endpoint)
  }

  useEffect(() => {
    init() // загружаем устройства при открытии страницы
  }, [init])

  if (loading) {
    return <div className={style.devicesList__loading}>Загрузка...</div>
  }

  if (error) {
    return <div className={style.devicesList__error}>⚠️ {error}</div>
  }

  return (
    <div className={style.devicesList}>
      <h3 className={style.devicesList__title}>📱 Ваши устройства</h3>

      {devices.length === 0 ? (
        <div className={style.devicesList__empty}>Устройства отсутствуют</div>
      ) : (
        devices.map((device) => {
          const isCurrent = browserSubscription?.endpoint === device.endpoint

          return (
            <div
              key={device._id}
              className={`${style.devicesList__item} ${isCurrent ? style.devicesList__item_current : ""}`}
            >
              <div className={style.devicesList__info}>
                <div className={style.devicesList__name}>
                  {device.browser} • {device.os}
                  {isCurrent && (
                    <span className={style.devicesList__currentBadge}>
                      текущее
                    </span>
                  )}
                </div>
                <div className={style.devicesList__date}>
                  {new Date(device.createdAt).toLocaleDateString("ru-RU")}
                </div>
              </div>

              <button
                onClick={() => handleDelete(device._id, device.endpoint)}
                className={style.devicesList__deleteButton}
                disabled={loading}
                title="Удалить устройство"
              >
                🗑
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}

// // components/DevicesList.tsx
// "use client"

// import { useEffect } from "react"
// import { usePushNotifications } from "@/hooks/usePushNotifications"

// import { useAppSelector } from "@/store/hooks"
// import { RootState } from "@/store/store"

// export function DevicesList() {
//   // const dispatch = useAppDispatch()
//   const { removeDevice } = usePushNotifications()

//   const devices = useAppSelector(
//     (state: RootState) => state.pushNotifications.devices,
//   )
//   const loading = useAppSelector(
//     (state: RootState) => state.pushNotifications.loading,
//   )

//   // Инициализация при монтировании (если ещё не сделано в провайдере)
//   useEffect(() => {
//     // init() должен быть вызван в провайдере, но можно и здесь для надёжности
//   }, [])

//   const handleDelete = async (deviceId: string, endpoint: string) => {
//     // // Проверяем, не текущее ли это устройство
//     // const isCurrent = endpoint === window?.navigator?.serviceWorker?.controller
//     // // ... логика сравнения, если нужно
//     let isCurrent = false
//     if (typeof window !== "undefined" && "serviceWorker" in navigator) {
//       try {
//         const registration = await navigator.serviceWorker.ready
//         const currentSub = await registration.pushManager.getSubscription()
//         // Сравниваем эндпоинты (строка с строкой)
//         if (currentSub && currentSub.endpoint === endpoint) {
//           isCurrent = true
//         }
//       } catch (err) {
//         console.warn("Не удалось проверить текущую подписку:", err)
//       }
//     }

//     const confirmed = window.confirm(
//       isCurrent
//         ? "Удалить текущее устройство? Уведомления перестанут приходить."
//         : "Удалить это устройство из списка?",
//     )
//     if (!confirmed) return

//     await removeDevice(deviceId, endpoint)
//   }

//   if (loading) {
//     return <div className="p-4">Загрузка...</div>
//   }

//   return (
//     <div className="space-y-3">
//       <h3 className="text-lg font-semibold">📱 Ваши устройства</h3>

//       {devices &&
//         devices.map((device) => (
//           <div
//             key={device._id}
//             className="p-3 border rounded flex justify-between"
//           >
//             <div>
//               <div className="font-medium">
//                 {device.browser} • {device.os}
//               </div>
//               <div className="text-sm text-gray-500">
//                 {new Date(device.createdAt).toLocaleDateString("ru-RU")}
//               </div>
//             </div>
//             <button
//               onClick={() => handleDelete(device._id, device.endpoint)}
//               className="text-red-500 hover:text-red-700"
//               disabled={loading}
//             >
//               🗑
//             </button>
//           </div>
//         ))}
//       {!devices && <div>Устройства отсутствуют</div>}
//     </div>
//   )
// }
