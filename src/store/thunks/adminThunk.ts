// thunks/adminThunk.ts
// import { adminAPI } from "@/api/api"
import { adminAPI } from "@/api/adminAPI"
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

type CreateTestUserParams = {
  username: string
}

export const createTestUserThunk = createAsyncThunk(
  "admin/createTestUser",
  async ({ username }: CreateTestUserParams, thunkAPI) => {
    try {
      const data = await adminAPI.createTestUser(username)
      return data
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }
      return thunkAPI.rejectWithValue("Ошибка при создании тестового аккаунта")
    }
  }
)
