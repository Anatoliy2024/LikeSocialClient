// store/thunks/postThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
// import { userPostType } from "../slices/userPostsSlice"
import { serverAPI } from "@/api/api"

export const getStatusServerThunk = createAsyncThunk(
  "server/statusServer",
  async (_, thunkAPI) => {
    try {
      const data = await serverAPI.statusServer()

      return data
    } catch (error: unknown) {
      // Проверка, является ли ошибка ошибкой Axios
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }

      // если это вообще не ошибка axios или нет message
      return thunkAPI.rejectWithValue("Ошибка при запросе статуса сервера")
    }
  }
)
