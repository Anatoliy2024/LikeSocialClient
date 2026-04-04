// store/slices/zombicideSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { ZombicideState, Room, GameState, GameMap } from "@/types/zombicide"
import {
  fetchRoomsThunk,
  createRoomThunk,
  joinRoomThunk,
  fetchMyMapsThunk,
  saveMapThunk,
  fetchMapsThunk,
  fetchMapByIdThunk,
} from "@/store/thunks/zombicideThunks"

const initialState: ZombicideState = {
  rooms: [],
  currentRoom: null,
  gameState: null,
  maps: [],
  currentMap: null,
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
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

    // --- fetchMaps ---
    builder
      .addCase(fetchMyMapsThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(
        fetchMyMapsThunk.fulfilled,
        (state, action: PayloadAction<GameMap[]>) => {
          state.status = "idle"
          state.maps = action.payload
        },
      )
      .addCase(fetchMyMapsThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось загрузить карты"
      })

    builder
      .addCase(fetchMapsThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchMapsThunk.fulfilled, (state, action) => {
        state.status = "idle"

        state.maps = action.payload.maps
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.total = action.payload.total
        state.pages = action.payload.pages
      })
      .addCase(fetchMapsThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось загрузить  карты"
      })
    builder
      .addCase(fetchMapByIdThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchMapByIdThunk.fulfilled, (state, action) => {
        state.status = "idle"

        state.currentMap = action.payload.map
      })
      .addCase(fetchMapByIdThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось загрузить  карту"
      })

    // --- saveMap ---
    builder
      .addCase(saveMapThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(saveMapThunk.fulfilled, (state, action) => {
        state.status = "idle"
        state.maps.push(action.payload.map)
      })
      .addCase(saveMapThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось сохранить карту"
      })
  },
})

export const { setGameState, leaveRoom, clearError } = zombicideSlice.actions
export default zombicideSlice.reducer
