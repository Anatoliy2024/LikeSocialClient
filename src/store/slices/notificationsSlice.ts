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
    addNotification(state, action) {
      state.items.unshift(action.payload)
      if (!action.payload.isRead) {
        state.unreadCount += 1
      }
    },
    dellNotification(state, action) {
      state.items = state.items.filter(
        (item) => item._id !== action.payload._id,
      )
      state.unreadCount -= 1
    },
    updateNotification(state, action) {
      state.items = state.items.map((item) => {
        if (item._id === action.payload.updated._id) {
          return action.payload.updated
        }
        return item
      })
    },
    updateNotificationIsReadMessage(state, action) {
      const { conversationId } = action.payload

      state.items.forEach((item) => {
        // 1. Проверяем, что это нужная беседа
        // (Сравниваем напрямую, если conversationId - это ObjectId/строка)
        if (item.conversationId?._id === conversationId) {
          // 2. Обновляем статус ТОЛЬКО если оно было непрочитанным
          if (!item.isRead) {
            item.isRead = true
            item.updatedAt = new Date().toISOString() // Обновляем время, если нужно для сортировки

            // 3. Уменьшаем счетчик только один раз для каждого нового прочтения
            if (state.unreadCount > 0) {
              state.unreadCount -= 1
            }
          }
        }
      })
    },

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
        // console.log("сработал fetchNotificationsThunk", action.payload)
        if (Array.isArray(notifications)) {
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

export const {
  addNotification,
  dellNotification,
  updateNotification,
  updateNotificationIsReadMessage,
} = notificationsSlice.actions
export default notificationsSlice.reducer
