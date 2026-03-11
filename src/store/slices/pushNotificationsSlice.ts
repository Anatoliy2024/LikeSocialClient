// store/slices/pushNotificationsSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import {
  initPushNotificationsThunk,
  fetchPushDevicesThunk,
  subscribeToPushThunk,
  deletePushDeviceThunk,
  type PushDevice,
} from "../thunks/pushNotificationsThunk"
import { PushSubscriptionJSON } from "@/lib/push-client"

interface PushNotificationsState {
  permission: NotificationPermission | "unsupported"
  browserSubscription: PushSubscriptionJSON | null
  devices: PushDevice[]
  isSubscribed: boolean
  loading: boolean
  error: string | null
}

const initialState: PushNotificationsState = {
  permission: "default",
  browserSubscription: null,
  devices: [],
  isSubscribed: false,
  loading: false,
  error: null,
}

const syncSubscriptionStatus = (state: PushNotificationsState) => {
  if (!state.browserSubscription) {
    state.isSubscribed = false
    return
  }
  state.isSubscribed = state.devices.some(
    (device) => device.endpoint === state.browserSubscription?.endpoint,
  )
}

const pushNotificationsSlice = createSlice({
  name: "pushNotifications",
  initialState,
  reducers: {
    // Принимаем значение снаружи — никаких side effects в reducer
    setPermission: (
      state,
      action: PayloadAction<NotificationPermission | "unsupported">,
    ) => {
      state.permission = action.payload
    },
    clearPushState: (state) => {
      state.devices = []
      state.browserSubscription = null
      state.isSubscribed = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Init
      .addCase(initPushNotificationsThunk.fulfilled, (state, action) => {
        state.permission = action.payload.permission
        state.browserSubscription = action.payload.browserSubscription
        syncSubscriptionStatus(state)
      })
      .addCase(initPushNotificationsThunk.rejected, (state, action) => {
        // SSR — просто игнорируем, не считаем ошибкой
        if (action.payload === "SSR") return
        state.error = action.payload ?? "Ошибка инициализации"
        state.permission = "unsupported"
      })

      // Fetch devices
      .addCase(fetchPushDevicesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPushDevicesThunk.fulfilled, (state, action) => {
        state.loading = false
        state.devices = action.payload.devices
        syncSubscriptionStatus(state)
      })
      .addCase(fetchPushDevicesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? "Ошибка загрузки устройств"
      })

      // Subscribe
      .addCase(subscribeToPushThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(subscribeToPushThunk.fulfilled, (state, action) => {
        state.loading = false
        state.browserSubscription = action.payload.subscription
        state.permission = "granted"
      })
      .addCase(subscribeToPushThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? "Ошибка подписки"
      })

      // Delete device
      .addCase(deletePushDeviceThunk.pending, (state) => {
        state.error = null
      })
      .addCase(deletePushDeviceThunk.fulfilled, (state, action) => {
        state.devices = state.devices.filter(
          (d) => d._id !== action.payload.deviceId,
        )
        // Если удалили текущее устройство — сбрасываем подписку
        if (action.payload.isCurrent) {
          state.browserSubscription = null
        }
        syncSubscriptionStatus(state)
      })
      .addCase(deletePushDeviceThunk.rejected, (state, action) => {
        state.error = action.payload ?? "Ошибка удаления устройства"
      })
  },
})

export const { setPermission, clearPushState } = pushNotificationsSlice.actions
export default pushNotificationsSlice.reducer

// // store/slices/pushNotificationsSlice.ts
// import { createSlice } from "@reduxjs/toolkit"
// import {
//   initPushNotificationsThunk,
//   fetchPushDevicesThunk,
//   subscribeToPushThunk,
//   //   unsubscribeFromAllPushThunk,
//   deletePushDeviceThunk,
//   type PushDevice,
// } from "../thunks/pushNotificationsThunk"
// import { PushSubscriptionJSON } from "@/lib/push-client"

// interface PushNotificationsState {
//   permission: NotificationPermission | "prompt" | "unsupported"
//   browserSubscription: PushSubscriptionJSON | null
//   devices: PushDevice[]
//   isSubscribed: boolean
//   loading: boolean
//   error: string | null
// }

// const initialState: PushNotificationsState = {
//   permission: "prompt",
//   browserSubscription: null,
//   devices: [],
//   isSubscribed: false,
//   loading: false,
//   error: null,
// }

// // 🔑 Вспомогательная функция: пересчёт isSubscribed
// const syncSubscriptionStatus = (state: PushNotificationsState) => {
//   if (!state.browserSubscription) {
//     state.isSubscribed = false
//     return
//   }
//   state.isSubscribed = state.devices.some(
//     (device) => device.endpoint === state.browserSubscription?.endpoint,
//   )
// }

// const pushNotificationsSlice = createSlice({
//   name: "pushNotifications",
//   initialState,
//   reducers: {
//     refreshPermission: (state) => {
//       if (typeof window !== "undefined") {
//         state.permission = Notification.permission
//       }
//     },
//     clearPushState: (state) => {
//       state.devices = []
//       state.browserSubscription = null
//       state.isSubscribed = false
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       // Init
//       .addCase(initPushNotificationsThunk.fulfilled, (state, action) => {
//         state.permission = action.payload.permission
//         state.browserSubscription = action.payload.browserSubscription
//         syncSubscriptionStatus(state)
//       })
//       .addCase(initPushNotificationsThunk.rejected, (state, action) => {
//         state.error = action.payload || "Ошибка инициализации"
//         state.permission = "unsupported"
//       })

//       // Fetch devices
//       .addCase(fetchPushDevicesThunk.pending, (state) => {
//         state.loading = true
//       })
//       .addCase(fetchPushDevicesThunk.fulfilled, (state, action) => {
//         state.loading = false
//         state.devices = action.payload.devices
//         syncSubscriptionStatus(state)
//       })
//       .addCase(fetchPushDevicesThunk.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload || "Ошибка загрузки"
//       })

//       // Subscribe
//       .addCase(subscribeToPushThunk.pending, (state) => {
//         state.loading = true
//         state.error = null
//       })
//       .addCase(subscribeToPushThunk.fulfilled, (state, action) => {
//         state.loading = false
//         state.browserSubscription = action.payload.subscription
//         state.permission = "granted"
//         // isSubscribed обновится после fetchPushDevicesThunk
//       })
//       .addCase(subscribeToPushThunk.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload || "Ошибка подписки"
//       })

//       //   // Unsubscribe all
//       //   .addCase(unsubscribeFromAllPushThunk.fulfilled, (state) => {
//       //     state.browserSubscription = null
//       //     state.isSubscribed = false
//       //   })

//       // Delete device
//       .addCase(deletePushDeviceThunk.fulfilled, (state, action) => {
//         // Оптимистичное удаление из списка (опционально)
//         state.devices = state.devices.filter(
//           (d) => d._id !== action.payload.deviceId,
//         )
//         syncSubscriptionStatus(state)
//       })
//   },
// })

// export const { refreshPermission, clearPushState } =
//   pushNotificationsSlice.actions
// export default pushNotificationsSlice.reducer
