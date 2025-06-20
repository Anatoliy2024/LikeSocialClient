// store/thunks/postThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { userPostType } from "../slices/userPostsSlice"
import { postAPI } from "@/api/api"

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
  async (postId: string, thunkAPI) => {
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
  async (
    { postId, comment }: { postId: string; comment: string },
    thunkAPI
  ) => {
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
