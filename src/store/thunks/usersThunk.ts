// store/thunks/postThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
// import { userPostType } from "../slices/userPostsSlice"
import { userAPI } from "@/api/api"

// type AsyncThunkArgs<TArg, TResult> = {
//   type: string
//   requestFn: (arg: TArg) => Promise<TResult>
//   errorMessage: string
// }

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
  any[], // тип данных, которые вернутся — массив пользователей
  string, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/getUserRelations", async (type, thunkAPI) => {
  try {
    const data = await userAPI.getUserRelations(type)
    return data
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.message || "Ошибка при получении данных"
    )
  }
})

export const requestFriendThunk = createAsyncThunk<
  any, // тип данных, которые вернутся — массив пользователей
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
  any, // тип данных, которые вернутся — массив пользователей
  string, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/acceptFriend", async (type, thunkAPI) => {
  try {
    const data = await userAPI.acceptFriend(type)
    return data
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.message || "Ошибка при добавлении друга"
    )
  }
})
export const delFriendThunk = createAsyncThunk<
  any, // тип данных, которые вернутся — массив пользователей
  string, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/delFriend", async (type, thunkAPI) => {
  try {
    const data = await userAPI.delFriend(type)
    return data
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.message || "Ошибка при удалении друга"
    )
  }
})
export const cancelRequestFriendThunk = createAsyncThunk<
  any, // тип данных, которые вернутся — массив пользователей
  string, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/cancelRequestFriend", async (type, thunkAPI) => {
  try {
    const data = await userAPI.cancelFriendRequest(type)
    return data
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.message || "Ошибка при удалении запроса на дружбу"
    )
  }
})
export const getMyFriendsIdThunk = createAsyncThunk<
  any, // тип данных, которые вернутся — массив пользователей
  void, // параметр — тип запроса: "friends" | "requests" | "sent"
  { rejectValue: string }
>("users/getMyFriendsId", async (_, thunkAPI) => {
  try {
    const data = await userAPI.getMyFriendsId()
    console.log("getMyFriendsIdThunk")
    return data
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.message || "Ошибка при получении getMyFriendsId"
    )
  }
})

// function createRequestThunk<TArg = void, TResult = unknown>({
//   type,
//   requestFn,
//   errorMessage,
// }: AsyncThunkArgs<TArg, TResult>) {
//   return createAsyncThunk<TResult, TArg>(type, async (arg: TArg, thunkAPI) => {
//     try {
//       const data = await requestFn(arg)
//       return data
//     } catch (error: unknown) {
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }
//       return thunkAPI.rejectWithValue(errorMessage)
//     }
//   })
// }
// getUserRelations("requests")    // входящие заявки
// getUserRelations("friends")     // друзья
// getUserRelations("sent")        // отправленные заявки

// export const getRequestFriend = createRequestThunk({
//   type: "user/getRequestFriend",
//   requestFn: userAPI.getUserRelations,
//   errorMessage: "Ошибка при отправке запроса в друзья",
// })

// export const getFriends = createRequestThunk({
//   type: "user/getFriends",
//   requestFn: userAPI.getUserRelations,
//   errorMessage: "Ошибка при получении списка друзей",
// })

// export const getSentRequests = createRequestThunk({
//   type: "user/getSentRequests",
//   requestFn: userAPI.getUserRelations,
//   errorMessage: "Ошибка при получении отправленных заявок",
// })

// export const getUserPostsThunk = createAsyncThunk(
//   "post/getPosts",
//   async (_, thunkAPI) => {
//     try {
//       const data = await postAPI.getUserPost()
//       return data
//     } catch (error: unknown) {
//       // Проверка, является ли ошибка ошибкой Axios
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }

//       // если это вообще не ошибка axios или нет message
//       return thunkAPI.rejectWithValue("Ошибка при получении постов")
//     }
//   }
// )
// export const delUserPostsThunk = createAsyncThunk(
//   "post/delPosts",
//   async (postId, thunkAPI) => {
//     try {
//       const data = await postAPI.delUserPost(postId)
//       return data
//     } catch (error: unknown) {
//       // Проверка, является ли ошибка ошибкой Axios
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }

//       // если это вообще не ошибка axios или нет message
//       return thunkAPI.rejectWithValue("Ошибка при удалении поста")
//     }
//   }
// )
