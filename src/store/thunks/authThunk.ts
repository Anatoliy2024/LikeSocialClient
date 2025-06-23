import { authAPI } from "@/api/api"
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { jwtDecode } from "jwt-decode"

type RegisterParams = {
  username: string
  email: string
  password: string
  inviteKey: string
}
type AuthParams = {
  username: string

  password: string
}
type VerifyParams = {
  username: string
  passwordVerify: string
}

interface DecodedToken {
  userId: string
  username: string
  email: string
  avatar?: string | null
  isVerified: boolean
  exp: number
  iat: number
}

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (
    { username, email, password, inviteKey }: RegisterParams,
    thunkAPI
  ) => {
    try {
      const data = await authAPI.register(username, email, password, inviteKey)
      console.log(data)

      // Распаковываем accessToken
      const decoded = jwtDecode<DecodedToken>(data.accessToken)

      return decoded
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Произошла ошибка при регистрации")
    }
  }
)
export const authThunk = createAsyncThunk(
  "auth/auth",
  async ({ username, password }: AuthParams, thunkAPI) => {
    try {
      const data = await authAPI.auth(username, password)
      const decoded = jwtDecode<DecodedToken>(data.accessToken)
      console.log(decoded)
      return decoded
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Произошла ошибка при авторизации")
    }
  }
)
export const verifyThunk = createAsyncThunk(
  "auth/verify",
  async ({ username, passwordVerify }: VerifyParams, thunkAPI) => {
    try {
      const data = await authAPI.verify(username, passwordVerify)
      console.log(data)
      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Произошла ошибка при верификации")
    }
  }
)

export const authCheckThunk = createAsyncThunk(
  "auth/me",
  async (_, thunkAPI) => {
    try {
      const data = await authAPI.me()
      console.log(data)

      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Произошла ошибка при authCheckThunk")
    }
  }
)
export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      const data = await authAPI.postLogout()
      console.log(data)

      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Произошла ошибка при logoutThunk")
    }
  }
)
