// // import { fileAPI, userAPI } from "@/api/api"
// import { userAPI } from "@/api/api"
// import { createAsyncThunk } from "@reduxjs/toolkit"
// import axios from "axios"
// import { PushDevice } from "../slices/pushDevicesSlice"
// // import { UserType } from "./usersThunk"

// // 🔹 Получение своего профиля (/users/me)
// export const fetchAllPushDevicesThunk = createAsyncThunk<
//   {
//     success?: boolean
//     devices?: PushDevice[]
//     message?: string
//   },
//   void,
//   { rejectValue: string }
// >("pushDevices/fetchAllPushDevices", async (_, thunkAPI) => {
//   try {
//     const data = await userAPI.getAllPushSubscription()
//     return data
//   } catch (error: unknown) {
//     if (axios.isAxiosError(error) && error.response?.data?.message) {
//       return thunkAPI.rejectWithValue(error.response.data.message)
//     }
//     return thunkAPI.rejectWithValue("Ошибка при получении AllPushDevices")
//   }
// })
// // 🔹 Получение своего профиля (/users/me)
// export const deletePushDeviceThunk = createAsyncThunk<
//   {
//     message: string
//     remainingCount: number
//     deviceId: string
//   },
//   string,
//   { rejectValue: string }
// >("pushDevices/deletePushDevice", async (deviceId, thunkAPI) => {
//   try {
//     const data = await userAPI.deletePushDevice(deviceId)
//     return data
//   } catch (error: unknown) {
//     if (axios.isAxiosError(error) && error.response?.data?.message) {
//       return thunkAPI.rejectWithValue(error.response.data.message)
//     }
//     return thunkAPI.rejectWithValue("Ошибка при deletePushDevice")
//   }
// })
