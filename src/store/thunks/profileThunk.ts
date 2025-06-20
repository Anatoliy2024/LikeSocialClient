import { userAPI } from "@/api/api"
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

export type ProfileType = {
  name: string
  sureName: string
  status: string
  age: string
  address: {
    country: string
    city: string
  }
  relationshipStatus: string
}

// 🔹 Получение своего профиля (/users/me)
export const getMyProfileThunk = createAsyncThunk<
  { userInfo: ProfileType; isMyProfile: boolean },
  void,
  { rejectValue: string }
>("profile/me", async (_, thunkAPI) => {
  try {
    const data = await userAPI.getUserInfo("myProfileInfo")
    return data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Ошибка при получении профиля")
  }
})

// 🔹 Получение чужого профиля (/users/:id)
export const getUserProfileThunk = createAsyncThunk<
  { userInfo: ProfileType; isMyProfile: boolean },
  string,
  { rejectValue: string }
>("profile/userById", async (userId, thunkAPI) => {
  try {
    const data = await userAPI.getUserInfo(userId)
    return data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Ошибка при получении чужого профиля")
  }
})

export const changeMyProfileThunk = createAsyncThunk<
  { userInfo: ProfileType; isMyProfile: boolean },
  { userInfo: ProfileType },
  { rejectValue: string }
>("profile/changeMyProfile", async (myProfileInfo, thunkAPI) => {
  try {
    // console.log("profile/changeMyProfile myProfileInfo", myProfileInfo)
    const data = await userAPI.updateMyProfile(myProfileInfo)
    console.log("profile/changeMyProfile data", data)
    return data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Ошибка при изменении моего профиля")
  }
})
