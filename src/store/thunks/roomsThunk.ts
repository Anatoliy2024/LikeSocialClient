import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { FormValuesAddRooms } from "../../app/(protected)/rooms/addRoomBlock/AddRoomBlock"
import { fileAPI, roomAPI } from "@/api/api"
type AddFriends = {
  users: string[]
  roomId: string
}
type DelFriends = {
  userId: string
  roomId: string
}
export type OwnerType = string | RoomMemberType | null
export type RoomType = {
  name: string
  description: string
  members: RoomMemberType[]
  owner: OwnerType
  createdAt: string
  updatedAt: string
  _id?: string
  avatar: string
  avatarPublicId: string
}

export type RoomMemberType = {
  _id?: string
  username: string
  avatar: string
}

export const createRoomThunk = createAsyncThunk<
  RoomType[], // тип данных, которые вернутся — массив пользователей
  FormValuesAddRooms, // параметр тип данных которые отправляю
  { rejectValue: string }
>("rooms/create", async ({ name, description }, thunkAPI) => {
  try {
    const data = await roomAPI.createRoom(name, description)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при создании комнаты")
  }
})
export const getRoomsThunk = createAsyncThunk<
  RoomType[], // тип данных, которые вернутся — массив пользователей
  void, // параметр тип данных которые отправляю
  { rejectValue: string }
>("rooms/getRooms", async (_, thunkAPI) => {
  try {
    const data = await roomAPI.getRooms()
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при создании комнаты")
  }
})
export const getRoomByIdThunk = createAsyncThunk<
  RoomType, // тип данных, которые вернутся — массив пользователей
  string, // параметр тип данных которые отправляю
  { rejectValue: string }
>("rooms/getRoomById", async (roomId, thunkAPI) => {
  try {
    const data = await roomAPI.getRoomById(roomId)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при получении данных комнаты")
  }
})

export const addFriendsToRoomThunk = createAsyncThunk<
  RoomType, // тип данных, которые вернутся — массив пользователей
  AddFriends, // параметр тип данных которые отправляю
  { rejectValue: string }
>("rooms/addFriendsToRoomThunk", async ({ users, roomId }, thunkAPI) => {
  try {
    const data = await roomAPI.addFriendsToRoom(users, roomId)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при добавлении друга в комнату")
  }
})
export const delFriendFromRoomThunk = createAsyncThunk<
  RoomType, // тип данных, которые вернутся — массив пользователей
  DelFriends, // параметр тип данных которые отправляю
  { rejectValue: string }
>("rooms/delFriendFromRoom", async ({ userId, roomId }, thunkAPI) => {
  try {
    console.log("delFriendFromRoom", userId)
    const data = await roomAPI.delFriendFromRoom(userId, roomId)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при удалении друга из комнаты")
  }
})
export const delRoomThunk = createAsyncThunk<
  RoomType[], // тип данных, которые вернутся — массив пользователей
  string, // параметр тип данных которые отправляю
  { rejectValue: string }
>("rooms/delRoom", async (roomId, thunkAPI) => {
  try {
    const data = await roomAPI.delRoom(roomId)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при удалении комнаты")
  }
})
export const leaveRoomThunk = createAsyncThunk<
  RoomType[], // тип данных, которые вернутся — массив пользователей
  string, // параметр тип данных которые отправляю
  { rejectValue: string }
>("rooms/leaveRoom", async (roomId, thunkAPI) => {
  try {
    const data = await roomAPI.leaveRoom(roomId)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при выходе из комнаты")
  }
})

export const changeAvatarRoomThunk = createAsyncThunk<
  { avatar: string; avatarPublicId: string }, // тип данных, которые вернутся — массив пользователей
  { file: File; roomId: string }, // параметр тип данных которые отправляю
  { rejectValue: string }
>("rooms/changeAvatarRoom", async ({ file, roomId }, thunkAPI) => {
  try {
    const data = await fileAPI.uploadRoomAvatar(file, roomId)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при изменении аватара комнаты")
  }
})
