// store/thunks/postThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { roomPostType } from "../slices/roomPostsSlice"
import { roomPostAPI } from "@/api/api"
import { RootState } from "../store"

// export interface RatingsType {
//   stars: number
//   acting: number
//   specialEffects: number
//   story: number
// }

// export interface CommentType {
//   _id: string
//   userId: {
//     _id: string
//     username: string
//     avatar: string
//   }
//   text: string
//   createdAt: string
// }

// export interface RoomPostType {
//   _id: string
//   authorId: string
//   authorName: string
//   title: string
//   avatar: string
//   avatarPublicId: string
//   content: string | null
//   ratings: RatingsType
//   genres: string[]
//   comments: CommentType[]
//   votesCount: number
//   createdAt: string
//   updatedAt: string
//   roomId: string
// }

export const createRoomPostThunk = createAsyncThunk<
  {
    posts: roomPostType[]
    page: number
    limit: number
    total: number
    pages: number
  }, // тип данных, которые вернутся — массив пользователей
  FormData, // параметр тип данных которые отправляю
  // Partial<roomPostType>, // параметр тип данных которые отправляю
  { rejectValue: string }
>("roomPost/createPost", async (postData, thunkAPI) => {
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
})
export const updateRoomPostThunk = createAsyncThunk<
  {
    post: roomPostType
  }, // тип данных, которые вернутся — массив пользователей
  FormData, // параметр тип данных которые отправляю
  // Partial<roomPostType>, // параметр тип данных которые отправляю
  { rejectValue: string }
>("roomPost/updatePost", async (dataForm, thunkAPI) => {
  try {
    console.log("Запустилась рум пост санка")
    const data = await roomPostAPI.updateRoomPost(dataForm)

    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при редактировании поста")
  }
})

export const getRoomPostsThunk = createAsyncThunk<
  {
    posts: roomPostType[]
    page: number
    limit: number
    total: number
    pages: number
  }, // тип данных, которые вернутся — массив пользователей
  { roomId: string; page: number }, // параметр тип данных которые отправляю
  { rejectValue: string }
>("roomPost/getPosts", async ({ roomId, page }, thunkAPI) => {
  const state = thunkAPI.getState() as RootState
  // const page = state.roomPost.page // если хранится в сторе
  const limit = state.roomPost.limit
  try {
    const data = await roomPostAPI.getRoomPosts(roomId, page, limit)
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
export const delRoomPostsThunk = createAsyncThunk<
  {
    posts: roomPostType[]
    page: number
    limit: number
    total: number
    pages: number
  }, // тип данных, которые вернутся — массив пользователей
  { postId: string; roomId: string | null; page: number }, // параметр тип данных которые отправляю
  { rejectValue: string }
>("roomPost/delPosts", async ({ postId, roomId, page }, thunkAPI) => {
  try {
    const data = await roomPostAPI.delRoomPost(postId, roomId, page)
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
export const createRoomCommentThunk = createAsyncThunk(
  "roomPost/createComment",
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

// export const uploadRoomPostAvatarThunk = createAsyncThunk(
//   "roomPost/uploadPostAvatar",
//   async ({ file, postId }: { file: File; postId: string }, thunkAPI) => {
//     try {
//       const data = await fileAPI.uploadRoomPostAvatar(file, postId)
//       return data
//     } catch (error: unknown) {
//       // Проверка, является ли ошибка ошибкой Axios
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }

//       // если это вообще не ошибка axios или нет message
//       return thunkAPI.rejectWithValue(
//         "Ошибка при изменении аватарки room поста"
//       )
//     }
//   }
// )
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
