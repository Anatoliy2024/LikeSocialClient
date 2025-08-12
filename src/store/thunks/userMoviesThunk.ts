import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

import { userMovieAPI, fileAPI } from "@/api/api"
import { imageIdType, UserMovieType } from "../slices/userMoviesSlice"
export type createUserMovieType = {
  title: string
  content: string
  genres: string[]
  avatarFile: FileList | null
  imageId?: imageIdType | null
  status?: string | null
  // avatar?: string
  _id?: string
  // imagePost?: string
}
// type userMovie = {
//   _id: string
//   title: string
//   genres: string[]
//   avatar: string
//   content?: string
//   status: "wantToSee" | "watched"
//   addedAt: string
// }

type UserMovieResponseType = {
  message: string
  userMovies: {
    movies: UserMovieType[]
    page: number
    limit: number
    total: number
    pages: number
  }
  status?: "wantToSee" | "watched"
}

// Создать фильм и получить обновлённый список своих фильмов
export const createUserMovieThunk = createAsyncThunk<
  // Тип данных, которые возвращает thunk (например, массив фильмов)
  UserMovieResponseType,
  // Тип параметра, который передаётся в thunk
  // createUserMovieType,
  FormData,
  // Типы для thunkAPI (опционально)
  { rejectValue: string }
>("userMovie/create", async (dataMovie, thunkAPI) => {
  try {
    const response = await userMovieAPI.createUserMovie(dataMovie)
    // В ответе ожидаем список всех своих фильмов

    return response
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue(
      "Ошибка при создании поста в createUserMovieThunk"
    )
  }
})
export const updateUserMovieThunk = createAsyncThunk<
  // Тип данных, которые возвращает thunk (например, массив фильмов)
  { movie: UserMovieType; message: string },
  // Тип параметра, который передаётся в thunk
  // createUserMovieType,
  { dataMovie: FormData; userMovieId: string },
  // Типы для thunkAPI (опционально)
  { rejectValue: string }
>("userMovie/update", async ({ dataMovie, userMovieId }, thunkAPI) => {
  try {
    const response = await userMovieAPI.updateUserMovie(dataMovie, userMovieId)
    // В ответе ожидаем список всех своих фильмов

    return response
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue(
      "Ошибка при изменении поста в updateUserMovieThunk"
    )
  }
})
export const addUserMovieThunk = createAsyncThunk<
  // Тип данных, которые возвращает thunk (например, массив фильмов)
  { message: string },
  // Тип параметра, который передаётся в thunk
  // createUserMovieType,
  { postId: string; roomId?: string },
  // Типы для thunkAPI (опционально)
  { rejectValue: string }
>("userMovie/add", async ({ postId, roomId }, thunkAPI) => {
  try {
    const response = await userMovieAPI.addUserMovie(postId, roomId)
    // В ответе ожидаем список всех своих фильмов

    return response
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue(
      "Ошибка при изменении поста в addUserMovieThunk"
    )
  }
})
export const deleteUserMovieThunk = createAsyncThunk<
  // Тип данных, которые возвращает thunk (например, массив фильмов)
  UserMovieResponseType,
  // Тип параметра, который передаётся в thunk
  { userMovieId: string; status: "wantToSee" | "watched"; page: number },
  // Типы для thunkAPI (опционально)
  { rejectValue: string }
>("userMovie/delete", async ({ userMovieId, status, page }, thunkAPI) => {
  try {
    const response = await userMovieAPI.deleteUserMovie(
      userMovieId,
      status,
      page
    )
    // В ответе ожидаем список всех своих фильмов

    return response
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue(
      "Ошибка при создании поста в deleteUserMovieThunk"
    )
  }
})

export const uploadUserMovieAvatarThunk = createAsyncThunk(
  "post/uploadRoomPostAvatar",
  async (
    {
      file,
      userMovieId,
      status,
    }: { file: File; userMovieId: string; status: string },
    thunkAPI
  ) => {
    try {
      const data = await fileAPI.uploadUserMovieAvatar(
        file,
        userMovieId,
        status
      )
      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Ошибка при изменении аватарки userMovie")
    }
  }
)

// uploadUserMovieAvatar

// // Отметить фильм просмотренным
// export const watchedUserMovieThunk = createAsyncThunk<
//   // Тип данных, которые возвращает thunk (например, массив фильмов)
//   UserMovieResponseType,
//   // Тип параметра, который передаётся в thunk
//   string,
//   // Типы для thunkAPI (опционально)
//   { rejectValue: string }
// >("userMovie/watched", async (userMovieId, thunkAPI) => {
//   try {
//     const updatedMovie = await userMovieAPI.watchedUserMovie(userMovieId)
//     return updatedMovie
//   } catch (error: unknown) {
//     // Проверка, является ли ошибка ошибкой Axios
//     if (axios.isAxiosError(error) && error.response?.data?.message) {
//       return thunkAPI.rejectWithValue(error.response.data.message)
//     }

//     // если это вообще не ошибка axios или нет message
//     return thunkAPI.rejectWithValue(
//       "Ошибка при изменении статуса фильма watchedUserMovieThunk"
//     )
//   }
// })
export const toggleUserMovieStatusThunk = createAsyncThunk<
  UserMovieResponseType,
  { userMovieId: string; newStatus: "wantToSee" | "watched"; page: number },
  { rejectValue: string }
>(
  "userMovie/toggleStatus",
  async ({ userMovieId, newStatus, page }, thunkAPI) => {
    try {
      const updatedMovie = await userMovieAPI.updateUserMovieStatus(
        userMovieId,
        newStatus,
        page
      )
      return updatedMovie
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }
      return thunkAPI.rejectWithValue("Ошибка при изменении статуса фильма")
    }
  }
)

// Получить свои фильмы по статусу "wantToSee"
export const fetchMyWantToSeeMoviesThunk = createAsyncThunk<
  UserMovieResponseType,
  number,
  { rejectValue: string }
>("userMovie/fetchMyWantToSee", async (page, thunkAPI) => {
  try {
    const movies = await userMovieAPI.getMyWantToSeeMovies(page)
    console.log("fetchMyWantToSeeMoviesThunk", movies)
    return movies
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue(
      "Ошибка при получении моих хочу посмотреть фильмов fetchMyWantToSeeMoviesThunk"
    )
  }
})

// Получить свои фильмы по статусу "watched"
export const fetchMyWatchedMoviesThunk = createAsyncThunk<
  UserMovieResponseType, // тип данных, которые вернутся — массив пользователей
  number, // параметр тип данных которые отправляю
  { rejectValue: string }
>("userMovie/fetchMyWatched", async (page, thunkAPI) => {
  try {
    const movies = await userMovieAPI.getMyWatchedMovies(page)
    return movies
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue(
      "Ошибка при получении моих просмотренных фильмов fetchMyWatchedMoviesThunk"
    )
  }
})

// Получить публичные фильмы другого пользователя "wantToSee"
export const fetchPublicWantToSeeMoviesThunk = createAsyncThunk<
  UserMovieResponseType, // тип данных, которые вернутся — массив пользователей
  { userId: string; page: number }, // параметр тип данных которые отправляю
  { rejectValue: string }
>("userMovie/fetchPublicWantToSee", async ({ userId, page }, thunkAPI) => {
  try {
    const movies = await userMovieAPI.getPublicWantToSeeMovies(userId, page)
    return movies
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue(
      "Ошибка при получении фильмов юзера хочу посмотреть фильмов fetchPublicWantToSeeMoviesThunk"
    )
  }
})

// Получить публичные фильмы другого пользователя "watched"
export const fetchPublicWatchedMoviesThunk = createAsyncThunk<
  UserMovieResponseType, // тип данных, которые вернутся — массив пользователей
  { userId: string; page: number }, // параметр тип данных которые отправляю
  { rejectValue: string }
>("userMovie/fetchPublicWatched", async ({ userId, page }, thunkAPI) => {
  try {
    const movies = await userMovieAPI.getPublicWatchedMovies(userId, page)
    return movies
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue(
      "Ошибка при получении  просмотренных фильмов юзера  fetchPublicWatchedMoviesThunk"
    )
  }
})

// export const getUserMovieThunk = createAsyncThunk(
//   "post/createPost",
//   async (userId: string, thunkAPI) => {
//     try {
//       const data = await userMovieAPI.getUserMovie(userId)

//       return data
//     } catch (error: unknown) {
//       // Проверка, является ли ошибка ошибкой Axios
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }

//       // если это вообще не ошибка axios или нет message
//       return thunkAPI.rejectWithValue("Ошибка при createUserMovie")
//     }
//   }
// )
