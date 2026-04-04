// store/slices/zombicideSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { ZombicideState, Room, GameState, GameMap } from "@/types/zombicide"
import {
  fetchRoomsThunk,
  createRoomThunk,
  joinRoomThunk,
  fetchMyMapsThunk,
  saveMapThunk,
} from "@/store/thunks/zombicideThunks"

const initialState: ZombicideState = {
  rooms: [],
  currentRoom: null,
  gameState: null,
  savedMaps: [],
  status: "idle",
  error: null,
}

const zombicideSlice = createSlice({
  name: "zombicide",
  initialState,
  reducers: {
    // вызывается когда сокет присылает новый стейт игры
    setGameState(state, action: PayloadAction<GameState>) {
      state.gameState = action.payload
    },

    // вызывается когда игрок покидает комнату
    leaveRoom(state) {
      state.currentRoom = null
      state.gameState = null
    },

    clearError(state) {
      state.error = null
    },
  },

  extraReducers: (builder) => {
    // --- fetchRooms ---
    builder
      .addCase(fetchRoomsThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(
        fetchRoomsThunk.fulfilled,
        (state, action: PayloadAction<Room[]>) => {
          state.status = "idle"
          state.rooms = action.payload
        },
      )
      .addCase(fetchRoomsThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось загрузить комнаты"
      })

    // --- createRoom ---
    builder
      .addCase(createRoomThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(
        createRoomThunk.fulfilled,
        (state, action: PayloadAction<Room>) => {
          state.status = "idle"
          state.currentRoom = action.payload
          state.rooms.push(action.payload)
        },
      )
      .addCase(createRoomThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось создать комнату"
      })

    // --- joinRoom ---
    builder
      .addCase(joinRoomThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(
        joinRoomThunk.fulfilled,
        (state, action: PayloadAction<Room>) => {
          state.status = "idle"
          state.currentRoom = action.payload
        },
      )
      .addCase(joinRoomThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось войти в комнату"
      })

    // --- fetchMyMaps ---
    builder
      .addCase(fetchMyMapsThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(
        fetchMyMapsThunk.fulfilled,
        (state, action: PayloadAction<GameMap[]>) => {
          state.status = "idle"
          state.savedMaps = action.payload
        },
      )
      .addCase(fetchMyMapsThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось загрузить карты"
      })

    // --- saveMap ---
    builder
      .addCase(saveMapThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(
        saveMapThunk.fulfilled,
        (state, action: PayloadAction<GameMap>) => {
          state.status = "idle"
          state.savedMaps.push(action.payload)
        },
      )
      .addCase(saveMapThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось сохранить карту"
      })
  },
})

export const { setGameState, leaveRoom, clearError } = zombicideSlice.actions
export default zombicideSlice.reducer
