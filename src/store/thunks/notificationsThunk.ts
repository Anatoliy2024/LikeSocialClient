import { notificationsAPI } from "@/api/api"
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
type senderType = {
  _id: string
  avatar: string
  username: string
}
export type notificationsType = {
  createdAt: string
  isRead: boolean
  message: string
  recipientId: string
  roomId: string | null
  senderId: senderType
  type: string
  __v: string
  _id: string
}

type notificationResType = {
  message: string
  notifications?: notificationsType[]
}

export const fetchNotificationsThunk = createAsyncThunk<
  notificationResType, // тип данных, которые вернутся — массив пользователей
  void, // параметр тип данных которые отправляю
  { rejectValue: string }
>("notifications/fetchNotifications", async (_, thunkAPI) => {
  try {
    const data = await notificationsAPI.fetchNotifications()
    // console.log("data fetchNotificationsThunk", data)
    // const response = await axios.get("/api/notifications")
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Ошибка загрузки уведомлений")
  }
})

export const markAllNotificationsReadThunk = createAsyncThunk<
  notificationResType, // тип данных, которые вернутся — массив пользователей
  void, // параметр тип данных которые отправляю
  { rejectValue: string }
>("notifications/markAllRead", async (_, thunkAPI) => {
  try {
    const data = await notificationsAPI.markAllNotificationsRead()

    // await axios.patch("/api/notifications/markAsRead", null)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue(
      "Ошибка отметки уведомлений как прочитанных"
    )
  }
})

// export const createNotificationThunk = createAsyncThunk(
//   "notifications/createNotification",
//   async (notificationData, thunkAPI) => {
//     try {
//       const data = await notificationsAPI.createNotification(notificationData)
//       // const response = await axios.post("/api/notifications", notificationData)
//       return data
//     } catch (error) {
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }
//       return thunkAPI.rejectWithValue("Ошибка создания уведомления")
//     }
//   }
// )

export const deleteNotificationThunk = createAsyncThunk<
  notificationResType, // тип данных, которые вернутся — массив пользователей
  string, // параметр тип данных которые отправляю
  { rejectValue: string }
>("notifications/deleteNotification", async (id, thunkAPI) => {
  try {
    const data = await notificationsAPI.deleteNotification(id)

    // await axios.delete(`/api/notifications/${id}`)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Ошибка удаления уведомления")
  }
})

export const deleteAllNotificationsThunk = createAsyncThunk<
  notificationResType, // тип данных, которые вернутся — массив пользователей
  void, // параметр тип данных которые отправляю
  { rejectValue: string }
>("notifications/deleteAllNotifications", async (_, thunkAPI) => {
  try {
    const data = notificationsAPI.deleteAllNotifications()
    // await axios.delete("/api/notifications")
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Ошибка очистки уведомлений")
  }
})
