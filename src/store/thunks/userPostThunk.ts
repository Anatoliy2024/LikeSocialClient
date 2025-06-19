// store/thunks/postThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { userPostType } from "../slices/userPostsSlice"
import { postAPI, voiceAPI } from "@/api/api"

export const createUserPostThunk = createAsyncThunk(
  "post/createPost",
  async (postData: Partial<userPostType>, thunkAPI) => {
    try {
      const data = await postAPI.createUserPost(postData)

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

export const getUserPostsThunk = createAsyncThunk(
  "post/getPosts",
  async (_, thunkAPI) => {
    try {
      const data = await postAPI.getUserPost()
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

export const getUserPostsByIdThunk = createAsyncThunk(
  "post/getUserPostsById",
  async (userId: string, thunkAPI) => {
    try {
      const data = await postAPI.getUserPostsByUserId(userId)
      return data
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }
      return thunkAPI.rejectWithValue(
        "Ошибка при получении постов пользователя"
      )
    }
  }
)

export const delUserPostsThunk = createAsyncThunk(
  "post/delPosts",
  async (postId, thunkAPI) => {
    try {
      const data = await postAPI.delUserPost(postId)
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
export const createUserCommentThunk = createAsyncThunk(
  "post/createUserComment",
  async ({ postId, comment }, thunkAPI) => {
    try {
      const data = await postAPI.createUserComment(postId, comment)
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
// export const createVoiceThunk = createAsyncThunk(
//   "post/createVoice",
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
// export const deleteUserCommentThunk = createAsyncThunk(
//   "post/deleteUserComment",
//   async ({ postId, userId }, thunkAPI) => {
//     try {
//       const data = await postAPI.createUserComment(postId,userId)
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
