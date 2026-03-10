// components/DevicesList.tsx
"use client"

import { useEffect } from "react"
import { usePushNotifications } from "@/hooks/usePushNotifications"

import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"

export function DevicesList() {
  // const dispatch = useAppDispatch()
  const { removeDevice } = usePushNotifications()

  const devices = useAppSelector(
    (state: RootState) => state.pushNotifications.devices,
  )
  const loading = useAppSelector(
    (state: RootState) => state.pushNotifications.loading,
  )

  // Инициализация при монтировании (если ещё не сделано в провайдере)
  useEffect(() => {
    // init() должен быть вызван в провайдере, но можно и здесь для надёжности
  }, [])

  const handleDelete = async (deviceId: string, endpoint: string) => {
    // // Проверяем, не текущее ли это устройство
    // const isCurrent = endpoint === window?.navigator?.serviceWorker?.controller
    // // ... логика сравнения, если нужно
    let isCurrent = false
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        const currentSub = await registration.pushManager.getSubscription()
        // Сравниваем эндпоинты (строка с строкой)
        if (currentSub && currentSub.endpoint === endpoint) {
          isCurrent = true
        }
      } catch (err) {
        console.warn("Не удалось проверить текущую подписку:", err)
      }
    }

    const confirmed = window.confirm(
      isCurrent
        ? "Удалить текущее устройство? Уведомления перестанут приходить."
        : "Удалить это устройство из списка?",
    )
    if (!confirmed) return

    await removeDevice(deviceId, endpoint)
  }

  if (loading) {
    return <div className="p-4">Загрузка...</div>
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">📱 Ваши устройства</h3>

      {devices &&
        devices.map((device) => (
          <div
            key={device._id}
            className="p-3 border rounded flex justify-between"
          >
            <div>
              <div className="font-medium">
                {device.browser} • {device.os}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(device.createdAt).toLocaleDateString("ru-RU")}
              </div>
            </div>
            <button
              onClick={() => handleDelete(device._id, device.endpoint)}
              className="text-red-500 hover:text-red-700"
              disabled={loading}
            >
              🗑
            </button>
          </div>
        ))}
      {!devices && <div>Устройства отсутствуют</div>}
    </div>
  )
}

// // components/DevicesList.tsx
// "use client"
// import { useEffect } from "react"
// import { RootState } from "@/store/store"
// import {
//   deletePushDeviceThunk,
//   fetchAllPushDevicesThunk,
// } from "@/store/thunks/pushDevicesThunk"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"

// export function DevicesList() {
//   const dispatch = useAppDispatch()
//   const { devices, loading } = useAppSelector(
//     (state: RootState) => state.pushDevices,
//   )

//   // Загружаем список при монтировании
//   useEffect(() => {
//     dispatch(fetchAllPushDevicesThunk())
//   }, [dispatch])

//   const handleDelete = async (deviceId: string) => {
//     await dispatch(deletePushDeviceThunk(deviceId))
//   }

//   if (loading && devices.length === 0) {
//     return <div className="p-4">Загрузка устройств...</div>
//   }

//   return (
//     <div className="space-y-3">
//       <h3 className="text-lg font-semibold">📱 Ваши устройства</h3>

//       {devices.length === 0 ? (
//         <p className="text-gray-500">Нет активных устройств</p>
//       ) : (
//         <ul className="space-y-2">
//           {devices.map((device) => (
//             <li key={device._id} className={`p-3 rounded-lg border `}>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="flex items-center gap-2">
//                     <span className="font-medium">
//                       {device.browser} {device.os && `• ${device.os}`}
//                     </span>
//                   </div>
//                   <div className="text-sm text-gray-500">
//                     {new Date(device.createdAt).toLocaleDateString("ru-RU")}
//                     {device.lastActive &&
//                       ` • Активно: ${new Date(device.lastActive).toLocaleDateString("ru-RU")}`}
//                   </div>
//                 </div>

//                 <button
//                   onClick={() => handleDelete(device._id)}
//                   disabled={loading}
//                   className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
//                 >
//                   {loading ? "..." : "🗑 Удалить"}
//                 </button>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   )
// }
