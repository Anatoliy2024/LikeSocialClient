// store/thunks/zombicideThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { Room, GameMap, Zone } from "@/types/zombicide"
import { zombicideAPI } from "@/api/zombicideAPI"

// --- лобби ---

export const fetchRoomsThunk = createAsyncThunk<
  Room[],
  void,
  { rejectValue: string }
>("zombicide/fetchRooms", async (_, thunkAPI) => {
  try {
    const data = await zombicideAPI.getRooms()
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось загрузить комнаты")
  }
})

export const createRoomThunk = createAsyncThunk<
  Room,
  { name: string; mapId: string; maxPlayers: number },
  { rejectValue: string }
>("zombicide/createRoom", async ({ name, mapId, maxPlayers }, thunkAPI) => {
  try {
    const data = await zombicideAPI.createRoom(name, mapId, maxPlayers)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось создать комнату")
  }
})

export const joinRoomThunk = createAsyncThunk<
  Room,
  { roomId: string },
  { rejectValue: string }
>("zombicide/joinRoom", async ({ roomId }, thunkAPI) => {
  try {
    const data = await zombicideAPI.joinRoom(roomId)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось войти в комнату")
  }
})

// --- карты ---

export const fetchMyMapsThunk = createAsyncThunk<
  GameMap[],
  void,
  { rejectValue: string }
>("zombicide/fetchMyMaps", async (_, thunkAPI) => {
  try {
    const data = await zombicideAPI.getMyMaps()
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось загрузить карты")
  }
})

export const saveMapThunk = createAsyncThunk<
  GameMap,
  { name: string; cols: number; rows: number; zones: Zone[] },
  { rejectValue: string }
>("zombicide/saveMap", async ({ name, cols, rows, zones }, thunkAPI) => {
  try {
    const data = await zombicideAPI.saveMap(name, cols, rows, zones)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось сохранить карту")
  }
})
