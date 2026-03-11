// store/thunks/pushNotificationsThunk.ts

import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { userAPI } from "@/api/api"
import {
  registerServiceWorker,
  requestPushSubscription,
  getCurrentBrowserSubscription,
  unsubscribeFromPush,
  type PushSubscriptionJSON,
} from "@/lib/push-client"

export type PushDevice = {
  _id: string
  endpoint: string
  browser?: string
  os?: string
  deviceType?: string
  createdAt: string
  lastActive?: string
}

type InitPushResult = {
  permission: NotificationPermission | "unsupported"
  browserSubscription: PushSubscriptionJSON | null
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return error.response.data.message
  }
  return error instanceof Error ? error.message : fallback
}

// 🔹 Инициализация + синхронизация endpoint
export const initPushNotificationsThunk = createAsyncThunk<
  InitPushResult,
  void,
  { rejectValue: string }
>("pushNotifications/init", async (_, thunkAPI) => {
  try {
    if (typeof window === "undefined") {
      return thunkAPI.rejectWithValue("SSR")
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return { permission: "unsupported", browserSubscription: null }
    }

    const permission = Notification.permission

    if (permission !== "granted") {
      return { permission, browserSubscription: null }
    }

    // Получаем текущую подписку браузера
    const browserSubscription = await getCurrentBrowserSubscription()

    // Если подписки в браузере нет — не трогаем ничего
    if (!browserSubscription) {
      return { permission, browserSubscription: null } // ← просто выходим
    }

    // Проверяем: знает ли сервер об этом endpoint
    const { devices } = await userAPI.getAllPushSubscription()
    const isRegistered = devices.some(
      (d: PushDevice) => d.endpoint === browserSubscription.endpoint,
    )

    // Если нет — синхронизируем (endpoint мог смениться)
    if (!isRegistered) {
      console.log("🔄 Endpoint не найден на сервере, синхронизируем...")
      await userAPI.savePushSubscription(browserSubscription)
    }

    return { permission, browserSubscription }
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(
      getErrorMessage(error, "Ошибка инициализации пушей"),
    )
  }
})

// 🔹 Получение списка устройств
export const fetchPushDevicesThunk = createAsyncThunk<
  { devices: PushDevice[] },
  void,
  { rejectValue: string }
>("pushNotifications/fetchDevices", async (_, thunkAPI) => {
  try {
    const data = await userAPI.getAllPushSubscription()
    return data
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(
      getErrorMessage(error, "Ошибка при получении списка устройств"),
    )
  }
})

// 🔹 Подписка: браузер + сервер
export const subscribeToPushThunk = createAsyncThunk<
  { subscription: PushSubscriptionJSON },
  void,
  { rejectValue: string }
>("pushNotifications/subscribe", async (_, thunkAPI) => {
  try {
    await registerServiceWorker()

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
    if (!vapidKey) throw new Error("VAPID_PUBLIC_KEY не найден в .env.local")

    const result = await requestPushSubscription(vapidKey)
    if (!result.success) {
      return thunkAPI.rejectWithValue(result.error)
    }

    await userAPI.savePushSubscription(result.subscription)

    return { subscription: result.subscription }
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(
      getErrorMessage(error, "Ошибка при подписке на уведомления"),
    )
  }
})

// 🔹 Удаление устройства
export const deletePushDeviceThunk = createAsyncThunk<
  { deviceId: string; isCurrent: boolean },
  { deviceId: string; endpoint?: string },
  { rejectValue: string }
>(
  "pushNotifications/deleteDevice",
  async ({ deviceId, endpoint }, thunkAPI) => {
    try {
      // Проверяем текущее устройство
      let isCurrent = false
      if (endpoint) {
        const currentSub = await getCurrentBrowserSubscription()
        isCurrent = currentSub?.endpoint === endpoint
      }

      // Удаляем с сервера
      await userAPI.deletePushDevice(deviceId)

      // Если текущее — отписываем в браузере
      if (isCurrent) {
        await unsubscribeFromPush()
      }

      return { deviceId, isCurrent }
    } catch (error: unknown) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(error, "Ошибка при удалении устройства"),
      )
    }
  },
)

// // store/thunks/pushNotificationsThunk.ts

// import { createAsyncThunk } from "@reduxjs/toolkit"
// import axios from "axios"
// import { userAPI } from "@/api/api"
// import {
//   registerServiceWorker,
//   requestPushSubscription,
//   //   unsubscribeFromPush,
//   type PushSubscriptionJSON,
// } from "@/lib/push-client"

// // Типы для ответов (вынесем в types/push.ts или оставим тут)
// export type PushDevice = {
//   _id: string
//   endpoint: string
//   browser?: string
//   os?: string
//   deviceType?: string
//   createdAt: string
//   lastActive?: string
// }

// type InitPushResult = {
//   permission: NotificationPermission | "unsupported"
//   browserSubscription: PushSubscriptionJSON | null
// }

// // 🔹 Инициализация: проверка поддержки и текущей подписки
// export const initPushNotificationsThunk = createAsyncThunk<
//   InitPushResult,
//   void,
//   { rejectValue: string }
// >("pushNotifications/init", async (_, thunkAPI) => {
//   try {
//     if (typeof window === "undefined") {
//       return thunkAPI.rejectWithValue("SSR")
//     }

//     if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
//       return { permission: "unsupported", browserSubscription: null }
//     }

//     const permission = Notification.permission
//     let browserSubscription: PushSubscriptionJSON | null = null

//     if (permission === "granted") {
//       const registration = await navigator.serviceWorker.ready
//       const subscription = await registration.pushManager.getSubscription()
//       if (subscription) {
//         browserSubscription = subscription.toJSON() as PushSubscriptionJSON
//       }
//     }

//     return { permission, browserSubscription }
//   } catch (error: unknown) {
//     if (axios.isAxiosError(error) && error.response?.data?.message) {
//       return thunkAPI.rejectWithValue(error.response.data.message)
//     }
//     return thunkAPI.rejectWithValue(
//       error instanceof Error ? error.message : "Ошибка инициализации пушей",
//     )
//   }
// })

// // 🔹 Получение списка устройств с сервера
// export const fetchPushDevicesThunk = createAsyncThunk<
//   { devices: PushDevice[] },
//   void,
//   { rejectValue: string }
// >("pushNotifications/fetchDevices", async (_, thunkAPI) => {
//   try {
//     const data = await userAPI.getAllPushSubscription()
//     return data // { devices: [...] }
//   } catch (error: unknown) {
//     if (axios.isAxiosError(error) && error.response?.data?.message) {
//       return thunkAPI.rejectWithValue(error.response.data.message)
//     }
//     return thunkAPI.rejectWithValue("Ошибка при получении списка устройств")
//   }
// })

// // 🔹 Подписка: браузер + сервер
// export const subscribeToPushThunk = createAsyncThunk<
//   { subscription: PushSubscriptionJSON },
//   void,
//   { rejectValue: string }
// >("pushNotifications/subscribe", async (_, thunkAPI) => {
//   try {
//     // 1. Регистрация воркера
//     await registerServiceWorker()

//     // 2. Получение подписки в браузере
//     const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
//     if (!vapidKey) throw new Error("VAPID_PUBLIC_KEY не найден в .env.local")

//     const result = await requestPushSubscription(vapidKey)
//     if (!result.success) {
//       return thunkAPI.rejectWithValue(result.error)
//     }

//     // 3. Отправка на сервер
//     await userAPI.savePushSubscription(result.subscription)

//     // 4. Возвращаем подписку (список обновится отдельно)
//     return { subscription: result.subscription }
//   } catch (error: unknown) {
//     if (axios.isAxiosError(error) && error.response?.data?.message) {
//       return thunkAPI.rejectWithValue(error.response.data.message)
//     }
//     return thunkAPI.rejectWithValue(
//       error instanceof Error
//         ? error.message
//         : "Ошибка при подписке на уведомления",
//     )
//   }
// })

// // // 🔹 Глобальная отписка: браузер + сервер (все устройства)
// // export const unsubscribeFromAllPushThunk = createAsyncThunk<
// //   { success: boolean },
// //   void,
// //   { rejectValue: string }
// // >("pushNotifications/unsubscribeAll", async (_, thunkAPI) => {
// //   try {
// //     // 1. Отписка в браузере
// //     await unsubscribeFromPush()

// //     // 2. Удаление всех подписок на сервере
// //     await userAPI.removePushSubscription()

// //     return { success: true }
// //   } catch (error: unknown) {
// //     if (axios.isAxiosError(error) && error.response?.data?.message) {
// //       return thunkAPI.rejectWithValue(error.response.data.message)
// //     }
// //     return thunkAPI.rejectWithValue(
// //       error instanceof Error
// //         ? error.message
// //         : "Ошибка при отписке от уведомлений",
// //     )
// //   }
// // })

// // // 🔹 Удаление конкретного устройства
// // export const deletePushDeviceThunk = createAsyncThunk<
// //   { deviceId: string },
// //   string,
// //   { rejectValue: string }
// // >("pushNotifications/deleteDevice", async (deviceId, thunkAPI) => {
// //   try {
// //     // 1. Удаляем с сервера
// //     await userAPI.deletePushDevice(deviceId)

// //     // 2. Возвращаем ID удалённого устройства (для оптимистичного обновления, если нужно)
// //     return { deviceId }
// //   } catch (error: unknown) {
// //     if (axios.isAxiosError(error) && error.response?.data?.message) {
// //       return thunkAPI.rejectWithValue(error.response.data.message)
// //     }
// //     return thunkAPI.rejectWithValue(
// //       error instanceof Error ? error.message : "Ошибка при удалении устройства",
// //     )
// //   }
// // })
// export const deletePushDeviceThunk = createAsyncThunk<
//   { deviceId: string; isCurrent: boolean },
//   { deviceId: string; endpoint?: string }, // 👈 Принимаем объект с аргументами
//   { rejectValue: string }
// >(
//   "pushNotifications/deleteDevice",
//   async ({ deviceId, endpoint }, thunkAPI) => {
//     try {
//       // 1. Проверяем, текущее ли это устройство (на клиенте)
//       let isCurrent = false
//       if (
//         endpoint &&
//         typeof window !== "undefined" &&
//         "serviceWorker" in navigator
//       ) {
//         try {
//           const registration = await navigator.serviceWorker.ready
//           const currentSub = await registration.pushManager.getSubscription()
//           if (currentSub && currentSub.endpoint === endpoint) {
//             isCurrent = true
//           }
//         } catch (err) {
//           console.warn("Не удалось проверить подписку:", err)
//         }
//       }

//       // 2. Удаляем с сервера
//       await userAPI.deletePushDevice(deviceId)

//       // 3. Если текущее — отписываем в браузере
//       if (isCurrent) {
//         const { unsubscribeFromPush } = await import("@/lib/push-client")
//         await unsubscribeFromPush()
//       }

//       return { deviceId, isCurrent }
//     } catch (error: unknown) {
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }
//       return thunkAPI.rejectWithValue(
//         error instanceof Error
//           ? error.message
//           : "Ошибка при подписке на уведомления",
//       )
//     }
//   },
// )
