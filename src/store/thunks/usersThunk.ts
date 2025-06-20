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

export const getAllUsersThunk = createAsyncThunk(
  "user/all",
  async (_, thunkAPI) => {
    try {
      const data = await userAPI.getAllUsers()

      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Ошибка при запросе всех юзеров")
    }
  }
)

export const getUserRelationsThunk = createAsyncThunk<
  UserType[], // тип данных, которые вернутся — массив пользователей
  string, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/getUserRelations", async (type, thunkAPI) => {
  try {
    const data = await userAPI.getUserRelations(type)
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
  UserType[], // тип данных, которые вернутся — массив пользователей
  string, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("user/requestFriend", async (userId, thunkAPI) => {
  try {
    const data = await userAPI.requestFriend(userId)

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
  { friends: UserType[]; friendRequests: UserType[] }, // тип данных, которые вернутся — массив пользователей
  string, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/acceptFriend", async (type, thunkAPI) => {
  try {
    const data = await userAPI.acceptFriend(type)
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
  UserType[], // тип данных, которые вернутся — массив пользователей
  string, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/delFriend", async (type, thunkAPI) => {
  try {
    const data = await userAPI.delFriend(type)
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
  UserType[], // тип данных, которые вернутся — массив пользователей
  string, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/cancelRequestFriend", async (type, thunkAPI) => {
  try {
    const data = await userAPI.cancelFriendRequest(type)
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
    console.log("getMyFriendsIdThunk")
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Ошибка при получении getMyFriendsId")
  }
})
