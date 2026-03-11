// hooks/usePushNotifications.ts

import { useCallback } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import {
  subscribeToPushThunk,
  fetchPushDevicesThunk,
  deletePushDeviceThunk,
} from "@/store/thunks/pushNotificationsThunk"
import {
  setPermission,
  clearPushState,
} from "@/store/slices/pushNotificationsSlice"

export function usePushNotifications() {
  const dispatch = useAppDispatch()

  const permission = useAppSelector(
    (s: RootState) => s.pushNotifications.permission,
  )
  const isSubscribed = useAppSelector(
    (s: RootState) => s.pushNotifications.isSubscribed,
  )
  const devices = useAppSelector((s: RootState) => s.pushNotifications.devices)
  const loading = useAppSelector((s: RootState) => s.pushNotifications.loading)
  const error = useAppSelector((s: RootState) => s.pushNotifications.error)
  const browserSubscription = useAppSelector(
    (s: RootState) => s.pushNotifications.browserSubscription,
  )

  const subscribe = useCallback(async () => {
    const result = await dispatch(subscribeToPushThunk())
    if (result.meta.requestStatus === "fulfilled") {
      dispatch(fetchPushDevicesThunk())
    }
    return result.meta.requestStatus === "fulfilled"
  }, [dispatch])

  const removeDevice = useCallback(
    async (deviceId: string, endpoint?: string) => {
      const result = await dispatch(
        deletePushDeviceThunk({ deviceId, endpoint }),
      )
      if (result.meta.requestStatus === "fulfilled") {
        dispatch(fetchPushDevicesThunk())
      }
      return result.meta.requestStatus === "fulfilled"
    },
    [dispatch],
  )

  // Вызывать когда пользователь вернулся на вкладку или открыл настройки
  const refreshPermission = useCallback(() => {
    if (typeof window === "undefined") return
    dispatch(setPermission(Notification.permission))
    dispatch(fetchPushDevicesThunk())
  }, [dispatch])

  const clear = useCallback(() => {
    dispatch(clearPushState())
  }, [dispatch])

  const init = useCallback(() => {
    dispatch(fetchPushDevicesThunk())
  }, [dispatch])

  return {
    // state
    permission,
    isSubscribed,
    devices,
    loading,
    error,
    browserSubscription,
    // computed
    canSubscribe:
      permission !== "denied" && permission !== "unsupported" && !isSubscribed,
    // actions
    subscribe,
    removeDevice,
    refreshPermission,
    clear,
    init,
  }
}

// // hooks/usePushNotifications.ts
// import { useCallback, useMemo } from "react"

// // import type { RootState } from "@/store"
// import {
//   initPushNotificationsThunk,
//   fetchPushDevicesThunk,
//   subscribeToPushThunk,
//   // unsubscribeFromAllPushThunk,
//   // unsubscribeFromPush,
//   deletePushDeviceThunk,
// } from "@/store/thunks/pushNotificationsThunk"
// // import { RootState } from "@/store/store"
// import {
//   useAppDispatch,
//   //  useAppSelector
// } from "@/store/hooks"
// import { refreshPermission } from "@/store/slices/pushNotificationsSlice"

// export function usePushNotifications() {
//   const dispatch = useAppDispatch()
//   // const state = useAppSelector((root: RootState) => root.pushNotifications)

//   const init = useCallback(() => {
//     dispatch(initPushNotificationsThunk())
//     dispatch(fetchPushDevicesThunk())
//   }, [dispatch])

//   const subscribe = useCallback(async () => {
//     const result = await dispatch(subscribeToPushThunk())
//     if (result.meta.requestStatus === "fulfilled") {
//       dispatch(fetchPushDevicesThunk()) // обновить список после подписки
//     }
//     return result.meta.requestStatus === "fulfilled"
//   }, [dispatch])

//   // const unsubscribe = useCallback(async () => {
//   //   const result = await dispatch(unsubscribeFromAllPushThunk())
//   //   if (result.meta.requestStatus === "fulfilled") {
//   //     dispatch(fetchPushDevicesThunk())
//   //   }
//   //   return result.meta.requestStatus === "fulfilled"
//   // }, [dispatch])

//   const removeDevice = useCallback(
//     async (deviceId: string, endpoint?: string) => {
//       const result = await dispatch(
//         deletePushDeviceThunk({ deviceId, endpoint }),
//       )
//       if (result.meta.requestStatus === "fulfilled") {
//         dispatch(fetchPushDevicesThunk())
//       }
//       return result.meta.requestStatus === "fulfilled"
//     },
//     [dispatch],
//   )

//   const refresh = useCallback(() => {
//     dispatch(refreshPermission())
//     dispatch(fetchPushDevicesThunk())
//   }, [dispatch])

//   return useMemo(() => {
//     return {
//       // ...state,
//       init,
//       subscribe,
//       // unsubscribe,
//       removeDevice,
//       refresh,
//       // canSubscribe: state.permission === "prompt" && !state.loading,
//     }
//   }, [init, subscribe, removeDevice, refresh])
//   // return {
//   //   // ...state,
//   //   init,
//   //   subscribe,
//   //   // unsubscribe,
//   //   removeDevice,
//   //   refresh,
//   //   canSubscribe: state.permission === "prompt" && !state.loading,
//   // }
// }

// // // src/hooks/usePushNotifications.ts
// // import { useState, useEffect, useCallback } from "react"
// // import {
// //   registerServiceWorker,
// //   requestPushSubscription,
// //   unsubscribeFromPush,
// //   type PushSubscriptionJSON,
// // } from "@/lib/push-client"
// // import { userAPI } from "@/api/api" // Ваш экземпляр axios

// // // Состояние хука
// // export type PushNotificationState = {
// //   permission: NotificationPermission | "prompt" | "unsupported"
// //   loading: boolean
// //   error: string | null
// //   subscription: PushSubscriptionJSON | null
// //   isSubscribed: boolean
// // }

// // // Возвращаемые методы
// // export type PushNotificationActions = {
// //   subscribe: () => Promise<boolean>
// //   unsubscribe: () => Promise<boolean>
// //   refreshPermission: () => Promise<void>
// // }

// // export function usePushNotifications() {
// //   const [state, setState] = useState<PushNotificationState>({
// //     permission: "prompt",
// //     loading: false,
// //     error: null,
// //     subscription: null,
// //     isSubscribed: false,
// //   })

// //   // 1. При монтировании: проверяем текущее состояние
// //   useEffect(() => {
// //     let mounted = true

// //     const init = async () => {
// //       // Проверка поддержки API
// //       if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
// //         setState((prev) => ({ ...prev, permission: "unsupported" }))
// //         return
// //       }

// //       try {
// //         // Проверяем текущее разрешение
// //         const permission = Notification.permission
// //         if (mounted) {
// //           setState((prev) => ({ ...prev, permission }))
// //         }

// //         // Если разрешение есть — пробуем получить активную подписку
// //         if (permission === "granted") {
// //           const registration = await navigator.serviceWorker.ready
// //           const subscription = await registration.pushManager.getSubscription()

// //           if (mounted && subscription) {
// //             const subscriptionJSON =
// //               subscription.toJSON() as PushSubscriptionJSON
// //             setState((prev) => ({
// //               ...prev,
// //               subscription: subscriptionJSON,
// //               isSubscribed: true,
// //             }))
// //           }
// //         }
// //       } catch (err) {
// //         console.error("Ошибка инициализации пушей:", err)
// //         if (mounted) {
// //           setState((prev) => ({
// //             ...prev,
// //             error: "Не удалось проверить статус подписки",
// //           }))
// //         }
// //       }
// //     }

// //     init()
// //     return () => {
// //       mounted = false
// //     }
// //   }, [])

// //   // 2. Метод подписки
// //   const subscribe = useCallback(async () => {
// //     console.log("🔔 [PUSH] === НАЧАЛО ПОДПИСКИ ===")
// //     setState((prev) => ({ ...prev, loading: true, error: null }))

// //     try {
// //       // --- ШАГ 1: Регистрация сервис-воркера ---
// //       console.log("🔵 [PUSH] Шаг 1: Регистрация Service Worker...")
// //       const registration = await registerServiceWorker()
// //       console.log(
// //         "✅ [PUSH] Шаг 1 завершён. SW активен:",
// //         registration.active?.scriptURL,
// //       )

// //       // --- ШАГ 2: Проверка VAPID ключа ---
// //       console.log("🔵 [PUSH] Шаг 2: Проверка VAPID_PUBLIC_KEY...")
// //       const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()

// //       if (!vapidKey) {
// //         throw new Error("VAPID_PUBLIC_KEY не найден в .env.local")
// //       }

// //       console.log("🔑 [DEBUG] VAPID ключ (полный):", vapidKey)
// //       console.log("🔑 [DEBUG] Длина ключа:", vapidKey.length)
// //       console.log(
// //         "🔑 [DEBUG] Содержит ли пробелы/переносы:",
// //         /[\s\n\r]/.test(vapidKey),
// //       )
// //       console.log('🔑 [DEBUG] Содержит ли "=" в конце:', vapidKey.endsWith("="))

// //       console.log(
// //         "✅ [PUSH] Шаг 2 завершён. Ключ найден (начало):",
// //         vapidKey.slice(0, 20) + "...",
// //       )

// //       // --- ШАГ 3: Запрос подписки у браузера ---
// //       console.log(
// //         "🔵 [PUSH] Шаг 3: Запрос подписки у браузера (может занять время)...",
// //       )
// //       const result = await requestPushSubscription(vapidKey)

// //       if (!result.success) {
// //         console.error("❌ [PUSH] Шаг 3 провален. Ошибка:", result.error)
// //         setState((prev) => ({
// //           ...prev,
// //           loading: false,
// //           error: result.error,
// //           permission: result.permission ?? prev.permission,
// //         }))
// //         return false
// //       }

// //       console.log("✅ [PUSH] Шаг 3 завершён. Подписка получена:", {
// //         endpoint: result.subscription.endpoint.slice(0, 50) + "...",
// //         hasP256dh: !!result.subscription.keys.p256dh,
// //         hasAuth: !!result.subscription.keys.auth,
// //       })

// //       // --- ШАГ 4: Отправка подписки на сервер ---
// //       console.log("🔵 [PUSH] Шаг 4: Отправка подписки на сервер...")
// //       console.log("📤 [PUSH] POST /api/user/push-subscription/save")

// //       const response = await userAPI.savePushSubscription(result.subscription)
// //       console.log("✅ [PUSH] Шаг 4 завершён. Ответ сервера:", response)

// //       // --- ШАГ 5: Обновление состояния ---
// //       console.log("🔵 [PUSH] Шаг 5: Обновление состояния хука...")
// //       setState((prev) => ({
// //         ...prev,
// //         loading: false,
// //         subscription: result.subscription,
// //         isSubscribed: true,
// //         permission: "granted",
// //       }))

// //       console.log("🎉 [PUSH] === ПОДПИСКА УСПЕШНО ЗАВЕРШЕНА ===")
// //       return true
// //     } catch (err) {
// //       console.error("❌ [PUSH] === КРИТИЧЕСКАЯ ОШИБКА ===")
// //       console.error(
// //         "🔴 [PUSH] Тип ошибки:",
// //         err instanceof Error ? err.name : "Unknown",
// //       )
// //       console.error(
// //         "🔴 [PUSH] Сообщение:",
// //         err instanceof Error ? err.message : err,
// //       )
// //       console.error(
// //         "🔴 [PUSH] Stack:",
// //         err instanceof Error ? err.stack : "No stack",
// //       )

// //       const errorMessage =
// //         err instanceof Error ? err.message : "Неизвестная ошибка подписки"
// //       setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
// //       return false
// //     }
// //   }, [])

// //   // 3. Метод отписки
// //   const unsubscribe = useCallback(async () => {
// //     setState((prev) => ({ ...prev, loading: true, error: null }))

// //     try {
// //       // 3.1. Отписываемся на уровне браузера
// //       const success = await unsubscribeFromPush()
// //       if (!success) {
// //         throw new Error("Не удалось отписаться от пушей")
// //       }

// //       // 3.2. Сообщаем серверу об удалении подписки
// //       // await userAPI.removePushSubscription()

// //       // 3.3. Обновляем состояние
// //       setState((prev) => ({
// //         ...prev,
// //         loading: false,
// //         subscription: null,
// //         isSubscribed: false,
// //       }))

// //       return true
// //     } catch (err) {
// //       const errorMessage = err instanceof Error ? err.message : "Ошибка отписки"
// //       setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
// //       return false
// //     }
// //   }, [])

// //   // 4. Метод обновления статуса разрешения (если пользователь изменил его в настройках браузера)
// //   const refreshPermission = useCallback(async () => {
// //     const permission = Notification.permission
// //     setState((prev) => ({ ...prev, permission }))

// //     if (permission === "granted") {
// //       const registration = await navigator.serviceWorker.ready
// //       const subscription = await registration.pushManager.getSubscription()
// //       if (subscription) {
// //         const subscriptionJSON = subscription.toJSON() as PushSubscriptionJSON
// //         setState((prev) => ({
// //           ...prev,
// //           subscription: subscriptionJSON,
// //           isSubscribed: true,
// //         }))
// //       }
// //     }
// //   }, [])

// //   return {
// //     ...state,
// //     subscribe,
// //     unsubscribe,
// //     refreshPermission,
// //   }
// // }
