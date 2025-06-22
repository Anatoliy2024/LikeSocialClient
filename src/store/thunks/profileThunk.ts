import { fileAPI, userAPI } from "@/api/api"
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

export type ProfileType = {
  name: string | null
  sureName: string | null
  status: string | null
  birthDate: string | null
  address: {
    country: string | null
    city: string | null
  }
  relationshipStatus: string | null
}

// 🔹 Получение своего профиля (/users/me)
export const getMyProfileThunk = createAsyncThunk<
  {
    userInfo: ProfileType
    isMyProfile: boolean
    avatar: string
    avatarPublicId: string
  },
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
  {
    userInfo: ProfileType
    isMyProfile: boolean
    avatar: string
    avatarPublicId: string
  },
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
export const changeAvatarUserThunk = createAsyncThunk<
  { avatar: string; avatarPublicId: string },
  File,
  { rejectValue: string }
>("profile/changeAvatarUser", async (file, thunkAPI) => {
  try {
    // console.log("profile/changeMyProfile myProfileInfo", myProfileInfo)
    const data = await fileAPI.uploadUserAvatar(file)
    console.log("profile/changeAvatarUserThunk ", data)
    return data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue(
      "Ошибка при изменении аватарки пользователя"
    )
  }
})
