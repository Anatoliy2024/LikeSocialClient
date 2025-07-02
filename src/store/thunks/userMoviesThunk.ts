import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

import { userMovieAPI } from "@/api/api"
import { UserMovieType } from "../slices/userMoviesSlice"
export type createUserMovieType = {
  title: string
  content: string
  genres: string[]
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
  userMovies: UserMovieType[]
}

// Создать фильм и получить обновлённый список своих фильмов
export const createUserMovieThunk = createAsyncThunk<
  // Тип данных, которые возвращает thunk (например, массив фильмов)
  UserMovieResponseType,
  // Тип параметра, который передаётся в thunk
  createUserMovieType,
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

// Отметить фильм просмотренным
export const watchedUserMovieThunk = createAsyncThunk(
  "userMovie/watched",
  async (userMovieId, thunkAPI) => {
    try {
      const updatedMovie = await userMovieAPI.watchedUserMovie(userMovieId)
      return updatedMovie
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue(
        "Ошибка при изменении статуса фильма watchedUserMovieThunk"
      )
    }
  }
)

// Получить свои фильмы по статусу "wantToSee"
export const fetchMyWantToSeeMoviesThunk = createAsyncThunk(
  "userMovie/fetchMyWantToSee",
  async (_, thunkAPI) => {
    try {
      const movies = await userMovieAPI.getMyWantToSeeMovies()
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
  }
)

// Получить свои фильмы по статусу "watched"
export const fetchMyWatchedMoviesThunk = createAsyncThunk(
  "userMovie/fetchMyWatched",
  async (_, thunkAPI) => {
    try {
      const movies = await userMovieAPI.getMyWatchedMovies()
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
  }
)

// Получить публичные фильмы другого пользователя "wantToSee"
export const fetchPublicWantToSeeMoviesThunk = createAsyncThunk(
  "userMovie/fetchPublicWantToSee",
  async (userId: string, thunkAPI) => {
    try {
      const movies = await userMovieAPI.getPublicWantToSeeMovies(userId)
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
  }
)

// Получить публичные фильмы другого пользователя "watched"
export const fetchPublicWatchedMoviesThunk = createAsyncThunk(
  "userMovie/fetchPublicWatched",
  async (userId: string, thunkAPI) => {
    try {
      const movies = await userMovieAPI.getPublicWatchedMovies(userId)
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
  }
)

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
