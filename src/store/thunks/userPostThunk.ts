// store/thunks/postThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { userPostType } from "../slices/userPostsSlice"
import { fileAPI, postAPI } from "@/api/api"

export const createUserPostThunk = createAsyncThunk<
  {
    posts: userPostType[]
    page: number
    limit: number
    total: number
    pages: number
  }, // тип данных, которые вернутся — массив пользователей
  Partial<userPostType>, // параметр тип данных которые отправляю
  { rejectValue: string }
>("post/createPost", async (postData, thunkAPI) => {
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
})

export const getUserPostsThunk = createAsyncThunk<
  {
    posts: userPostType[]
    page: number
    limit: number
    total: number
    pages: number
  }, // тип данных, которые вернутся — массив пользователей
  number, // параметр тип данных которые отправляю
  { rejectValue: string }
>("post/getPosts", async (page, thunkAPI) => {
  try {
    const data = await postAPI.getUserPost(page)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при получении постов")
  }
})

export const getUserPostsByIdThunk = createAsyncThunk<
  {
    posts: userPostType[]
    page: number
    limit: number
    total: number
    pages: number
  }, // тип данных, которые вернутся — массив пользователей
  { userId: string; page: number }, // параметр тип данных которые отправляю
  { rejectValue: string }
>("post/getUserPostsById", async ({ userId, page }, thunkAPI) => {
  try {
    const data = await postAPI.getUserPostsByUserId(userId, page)
    return data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Ошибка при получении постов пользователя")
  }
})

export const delUserPostsThunk = createAsyncThunk<
  {
    posts: userPostType[]
    page: number
    limit: number
    total: number
    pages: number
  }, // тип данных, которые вернутся — массив пользователей
  { postId: string; page: number }, // параметр тип данных которые отправляю
  { rejectValue: string }
>("post/delPosts", async ({ postId, page }, thunkAPI) => {
  try {
    const data = await postAPI.delUserPost(postId, page)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при удалении поста")
  }
})
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
export const uploadUserPostAvatarThunk = createAsyncThunk(
  "post/uploadUserPostAvatar",
  async ({ file, postId }: { file: File; postId: string }, thunkAPI) => {
    try {
      const data = await fileAPI.uploadUserPostAvatar(file, postId)
      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue(
        "Ошибка при изменении аватарки user поста"
      )
    }
  }
)
