// store/thunks/postThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
// import { userPostType } from "../slices/userPostsSlice"
import { userAPI } from "@/api/api"

export type UserType = {
  username: string
  avatar: string
  _id: string
}
export type UserTypeReq = {
  users: UserType[]
  page: number
  limit: number
  total: number
  pages: number
}

export const getAllUsersThunk = createAsyncThunk<
  UserTypeReq, // тип данных, которые вернутся — массив пользователей
  number, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("user/all", async (page, thunkAPI) => {
  try {
    const data = await userAPI.getAllUsers(page)

    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при запросе всех юзеров")
  }
})

export const getUserRelationsThunk = createAsyncThunk<
  UserTypeReq, // тип данных, которые вернутся — массив пользователей
  { type: string; page: number }, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/getUserRelations", async ({ type, page }, thunkAPI) => {
  try {
    const data = await userAPI.getUserRelations(type, page)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    return thunkAPI.rejectWithValue("Ошибка при получении данных")
  }
})

export const requestFriendThunk = createAsyncThunk<
  UserTypeReq, // тип данных, которые вернутся — массив пользователей
  { userId: string; page: number }, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("user/requestFriend", async ({ userId, page }, thunkAPI) => {
  try {
    const data = await userAPI.requestFriend(userId, page)

    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue(
      "Ошибка при отправке запроса на добавление в друзья"
    )
  }
})

export const acceptFriendThunk = createAsyncThunk<
  { friends: UserTypeReq; friendRequests: UserTypeReq }, // тип данных, которые вернутся — массив пользователей
  { type: string; page: number }, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/acceptFriend", async ({ type, page }, thunkAPI) => {
  try {
    const data = await userAPI.acceptFriend(type, page)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Ошибка при добавлении друга")
  }
})
export const delFriendThunk = createAsyncThunk<
  UserTypeReq, // тип данных, которые вернутся — массив пользователей
  { type: string; page: number }, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/delFriend", async ({ type, page }, thunkAPI) => {
  try {
    const data = await userAPI.delFriend(type, page)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Ошибка при удалении друга")
  }
})
export const cancelRequestFriendThunk = createAsyncThunk<
  UserTypeReq, // тип данных, которые вернутся — массив пользователей
  { type: string; page: number }, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/cancelRequestFriend", async ({ type, page }, thunkAPI) => {
  try {
    const data = await userAPI.cancelFriendRequest(type, page)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    return thunkAPI.rejectWithValue("Ошибка при удалении запроса на дружбу")
  }
})
export const getMyFriendsIdThunk = createAsyncThunk<
  {
    friends: UserTypeReq
    friendRequests: UserTypeReq
    sentFriendRequests: UserTypeReq
  }, // тип данных, которые вернутся — массив пользователей
  { friendsPage: number; requestsPage: number; sentPage: number }, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>(
  "users/getMyFriendsId",
  async ({ friendsPage, requestsPage, sentPage }, thunkAPI) => {
    try {
      const data = await userAPI.getMyFriendsId(
        friendsPage,
        requestsPage,
        sentPage
      )
      console.log("getMyFriendsIdThunk")
      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }
      return thunkAPI.rejectWithValue("Ошибка при получении getMyFriendsId")
    }
  }
)
