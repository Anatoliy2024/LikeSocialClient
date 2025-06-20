// store/thunks/postThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { roomPostType } from "../slices/roomPostsSlice"
import { roomPostAPI } from "@/api/api"

export const createRoomPostThunk = createAsyncThunk(
  "post/createPost",
  async (postData: Partial<roomPostType>, thunkAPI) => {
    try {
      const data = await roomPostAPI.createRoomPost(postData)

      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Ошибка при создании поста")
    }
  }
)

export const getRoomPostsThunk = createAsyncThunk(
  "post/getPosts",
  async (roomId: string, thunkAPI) => {
    try {
      const data = await roomPostAPI.getRoomPosts(roomId)
      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Ошибка при получении постов")
    }
  }
)
export const delRoomPostsThunk = createAsyncThunk(
  "post/delPosts",
  async ({ postId, roomId }: { postId: string; roomId: string }, thunkAPI) => {
    try {
      const data = await roomPostAPI.delRoomPost(postId, roomId)
      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Ошибка при удалении поста")
    }
  }
)
export const createRoomCommentThunk = createAsyncThunk(
  "post/createRoomComment",
  async ({ postId, roomId, comment }: Record<string, string>, thunkAPI) => {
    try {
      const data = await roomPostAPI.createRoomComment(postId, roomId, comment)
      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Ошибка при создании коммента")
    }
  }
)
// export const createRoomVoiceThunk = createAsyncThunk(
//   "post/createRoomVoice",
//   async (dataInfo, thunkAPI) => {
//     try {
//       const data = await voiceAPI.createVoice(dataInfo)
//       return data
//     } catch (error: unknown) {
//       // Проверка, является ли ошибка ошибкой Axios
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }

//       // если это вообще не ошибка axios или нет message
//       return thunkAPI.rejectWithValue("Ошибка при создании коммента")
//     }
//   }
// )
