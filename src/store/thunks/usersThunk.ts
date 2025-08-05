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

export type ProfileFriendResponse = {
  friendshipStatus: "friend" | "incoming" | "outgoing" | "none"
}
export type RequestFriendResponse = UserTypeReq | ProfileFriendResponse

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
  RequestFriendResponse, // тип данных, которые вернутся — массив пользователей
  { userId: string; page?: number; profile?: string }, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("user/requestFriend", async ({ userId, page, profile }, thunkAPI) => {
  try {
    // console.log("userId, page", userId, page)
    const data = await userAPI.requestFriend(userId, page, profile)

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
  { friends: UserTypeReq; friendRequests: UserTypeReq | ProfileFriendResponse }, // тип данных, которые вернутся — массив пользователей
  { userId: string; page?: number; profile?: string }, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/acceptFriend", async ({ userId, page, profile }, thunkAPI) => {
  try {
    const data = await userAPI.acceptFriend(userId, page, profile)
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
  RequestFriendResponse, // тип данных, которые вернутся — массив пользователей
  { userId: string; page?: number; profile?: string }, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/delFriend", async ({ userId, page, profile }, thunkAPI) => {
  try {
    const data = await userAPI.delFriend(userId, page, profile)
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
  RequestFriendResponse, // тип данных, которые вернутся — массив пользователей
  { userId: string; page?: number; profile?: string }, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/cancelRequestFriend", async ({ userId, page, profile }, thunkAPI) => {
  try {
    // console.log("Отменить заявку*****")

    const data = await userAPI.cancelFriendRequest(userId, page, profile)
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
    friends: UserType[]
    friendRequests: UserType[]
    sentFriendRequests: UserType[]
  }, // тип данных, которые вернутся — массив пользователей
  void, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/getMyFriendsId", async (_, thunkAPI) => {
  try {
    const data = await userAPI.getMyFriendsId()
    // console.log("getMyFriendsIdThunk")
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Ошибка при получении getMyFriendsId")
  }
})

export const getUserStatusThunk = createAsyncThunk<
  ProfileFriendResponse, // тип данных, которые вернутся — массив пользователей
  string, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("user/getUserStatus", async (userId, thunkAPI) => {
  try {
    const data = await userAPI.getUserStatus(userId)

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
