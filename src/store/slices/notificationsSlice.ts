import { createSlice } from "@reduxjs/toolkit"
import {
  fetchNotificationsThunk,
  markAllNotificationsReadThunk,
  // createNotificationThunk,
  deleteNotificationThunk,
  deleteAllNotificationsThunk,
  notificationsType,
} from "../thunks/notificationsThunk"
export type initialStateNotificationsType = {
  items: notificationsType[]
  loading: boolean
  error: null | string
  unreadCount: number
}

const initialState: initialStateNotificationsType = {
  items: [],
  loading: false,
  error: null,
  unreadCount: 0,
}

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // removeNotification(state, action) {
    //   state.items = state.items.filter((n) => n._id !== action.payload)
    //   state.unreadCount = state.items.filter((n) => !n.isRead).length
    // },
  },
  extraReducers: (builder) => {
    builder
      // Получение уведомлений
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.loading = false
        const notifications = action.payload.notifications
        if (notifications) {
          state.items = notifications
          state.unreadCount = notifications.filter((n) => !n.isRead).length
        }
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.loading = false
        // state.error = action.error.message || "Ошибка при создании поста"
        state.error = action.error.message || "Ошибка загрузки уведомлений"
      })

      // Отметить все как прочитанные
      .addCase(markAllNotificationsReadThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
        state.loading = false
        state.items = state.items.map((n) => ({ ...n, isRead: true }))
        state.unreadCount = 0
      })
      .addCase(markAllNotificationsReadThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка обновления уведомлений"
      })

      // // Создание уведомления
      // .addCase(createNotificationThunk.pending, (state) => {
      //   state.loading = true
      //   state.error = null
      // })
      // .addCase(createNotificationThunk.fulfilled, (state, action) => {
      //   state.loading = false
      //   const notification = action.payload.notifications

      //   state.items = notification
      //   state.unreadCount = notification.filter((n) => !n.isRead).length
      //   // state.items.unshift(action.payload) // Добавляем новое уведомление в начало
      // })
      // .addCase(createNotificationThunk.rejected, (state, action) => {
      //   state.loading = false
      //   state.error = action.error.message || "Ошибка создания уведомления"
      // })

      // Удаление одного уведомления
      .addCase(deleteNotificationThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        state.loading = false
        const notifications = action.payload.notifications
        if (notifications) {
          state.items = notifications
          state.unreadCount = notifications.filter((n) => !n.isRead).length
        }
      })
      .addCase(deleteNotificationThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка удаления уведомления"
      })

      // Удаление всех уведомлений
      .addCase(deleteAllNotificationsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteAllNotificationsThunk.fulfilled, (state) => {
        state.loading = false
        state.items = []
        state.unreadCount = 0
      })
      .addCase(deleteAllNotificationsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка очистки уведомлений"
      })
  },
})

// export const { removeNotification } = notificationsSlice.actions
export default notificationsSlice.reducer
