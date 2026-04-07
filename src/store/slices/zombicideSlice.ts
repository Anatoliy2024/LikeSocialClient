// store/slices/zombicideSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { ZombicideState, GameState } from "@/types/zombicide"
import {
  fetchRoomsThunk,
  createRoomThunk,
  joinRoomThunk,
  fetchMyMapsThunk,
  saveMapThunk,
  fetchMapsThunk,
  fetchMapByIdThunk,
  deleteMapThunk,
} from "@/store/thunks/zombicideThunks"

const initialState: ZombicideState = {
  rooms: [],
  currentRoom: null,
  activeGame: null,
  maps: [],
  currentMap: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  status: "idle",
  error: null,
}

const zombicideSlice = createSlice({
  name: "zombicide",
  initialState,
  reducers: {
    setGameState(state, action: PayloadAction<GameState>) {
      state.activeGame = action.payload
    },
    leaveRoom(state) {
      state.currentRoom = null
      state.activeGame = null
    },
    clearError(state) {
      state.error = null
    },
    clearCurrentMap(state) {
      state.currentMap = null
    },
  },

  extraReducers: (builder) => {
    // --- fetchRooms ---
    builder
      .addCase(fetchRoomsThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchRoomsThunk.fulfilled, (state, action) => {
        state.status = "idle"
        state.rooms = action.payload
      })
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
      .addCase(createRoomThunk.fulfilled, (state, action) => {
        state.status = "idle"
        state.currentRoom = action.payload
        state.rooms.push(action.payload)
      })
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
      .addCase(joinRoomThunk.fulfilled, (state, action) => {
        state.status = "idle"
        state.currentRoom = action.payload
      })
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
      .addCase(fetchMyMapsThunk.fulfilled, (state, action) => {
        state.status = "idle"
        state.maps = action.payload.maps
        state.pagination.page = action.payload.page
        state.pagination.limit = action.payload.limit
        state.pagination.total = action.payload.total
        state.pagination.pages = action.payload.pages
      })
      .addCase(fetchMyMapsThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось загрузить карты"
      })

    // --- fetchMaps ---
    builder
      .addCase(fetchMapsThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchMapsThunk.fulfilled, (state, action) => {
        state.status = "idle"
        state.maps = action.payload.maps
        state.pagination.page = action.payload.page
        state.pagination.limit = action.payload.limit
        state.pagination.total = action.payload.total
        state.pagination.pages = action.payload.pages
      })
      .addCase(fetchMapsThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось загрузить карты"
      })

    // --- fetchMapById ---
    builder
      .addCase(fetchMapByIdThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchMapByIdThunk.fulfilled, (state, action) => {
        state.status = "idle"
        state.currentMap = action.payload.map // ✅ GameMap с 2D cells
      })
      .addCase(fetchMapByIdThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось загрузить карту"
      })

    // --- saveMap ---
    builder
      .addCase(saveMapThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(saveMapThunk.fulfilled, (state, action) => {
        state.status = "idle"
        // ✅ action.payload.map уже содержит cells: Cell[][]
        state.maps.push(action.payload.map)
        // Опционально: обновить currentMap, если только что сохранённая карта открыта
        if (state.currentMap?._id === action.payload.map._id) {
          state.currentMap = action.payload.map
        }
      })
      .addCase(saveMapThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось сохранить карту"
      })

    // --- deleteMap ---
    builder
      .addCase(deleteMapThunk.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(deleteMapThunk.fulfilled, (state, action) => {
        state.status = "idle"
        state.maps = state.maps.filter(
          (map) => map._id !== action.payload.mapId,
        )
        if (state.currentMap?._id === action.payload.mapId) {
          state.currentMap = null
        }
      })
      .addCase(deleteMapThunk.rejected, (state, action) => {
        state.status = "error"
        state.error = action.payload ?? "Не удалось удалить карту"
      })
  },
})

export const {
  // setGameState,
  leaveRoom,
  clearError,
  clearCurrentMap,
} = zombicideSlice.actions
export default zombicideSlice.reducer

// // store/slices/zombicideSlice.ts
// import { createSlice, PayloadAction } from "@reduxjs/toolkit"
// import { ZombicideState, Room, GameState } from "@/types/zombicide"
// import {
//   fetchRoomsThunk,
//   createRoomThunk,
//   joinRoomThunk,
//   fetchMyMapsThunk,
//   saveMapThunk,
//   fetchMapsThunk,
//   fetchMapByIdThunk,
//   deleteMapThunk,
// } from "@/store/thunks/zombicideThunks"

// const initialState: ZombicideState = {
//   rooms: [],
//   currentRoom: null,
//   gameState: null,
//   maps: [],
//   currentMap: null,
//   page: 1,
//   limit: 10,
//   total: 0,
//   pages: 0,
//   status: "idle",
//   error: null,
// }

// const zombicideSlice = createSlice({
//   name: "zombicide",
//   initialState,
//   reducers: {
//     // вызывается когда сокет присылает новый стейт игры
//     setGameState(state, action: PayloadAction<GameState>) {
//       state.gameState = action.payload
//     },

//     // вызывается когда игрок покидает комнату
//     leaveRoom(state) {
//       state.currentRoom = null
//       state.gameState = null
//     },

//     clearError(state) {
//       state.error = null
//     },
//     clearCurrentMap(state) {
//       state.currentMap = null
//     },
//   },

//   extraReducers: (builder) => {
//     // --- fetchRooms ---
//     builder
//       .addCase(fetchRoomsThunk.pending, (state) => {
//         state.status = "loading"
//         state.error = null
//       })
//       .addCase(
//         fetchRoomsThunk.fulfilled,
//         (state, action: PayloadAction<Room[]>) => {
//           state.status = "idle"
//           state.rooms = action.payload
//         },
//       )
//       .addCase(fetchRoomsThunk.rejected, (state, action) => {
//         state.status = "error"
//         state.error = action.payload ?? "Не удалось загрузить комнаты"
//       })

//     // --- createRoom ---
//     builder
//       .addCase(createRoomThunk.pending, (state) => {
//         state.status = "loading"
//         state.error = null
//       })
//       .addCase(
//         createRoomThunk.fulfilled,
//         (state, action: PayloadAction<Room>) => {
//           state.status = "idle"
//           state.currentRoom = action.payload
//           state.rooms.push(action.payload)
//         },
//       )
//       .addCase(createRoomThunk.rejected, (state, action) => {
//         state.status = "error"
//         state.error = action.payload ?? "Не удалось создать комнату"
//       })

//     // --- joinRoom ---
//     builder
//       .addCase(joinRoomThunk.pending, (state) => {
//         state.status = "loading"
//         state.error = null
//       })
//       .addCase(
//         joinRoomThunk.fulfilled,
//         (state, action: PayloadAction<Room>) => {
//           state.status = "idle"
//           state.currentRoom = action.payload
//         },
//       )
//       .addCase(joinRoomThunk.rejected, (state, action) => {
//         state.status = "error"
//         state.error = action.payload ?? "Не удалось войти в комнату"
//       })

//     // --- fetchMaps ---
//     builder
//       .addCase(fetchMyMapsThunk.pending, (state) => {
//         state.status = "loading"
//         state.error = null
//       })
//       .addCase(fetchMyMapsThunk.fulfilled, (state, action) => {
//         state.status = "idle"
//         state.maps = action.payload.maps
//         state.page = action.payload.page
//         state.limit = action.payload.limit
//         state.total = action.payload.total
//         state.pages = action.payload.pages
//       })
//       .addCase(fetchMyMapsThunk.rejected, (state, action) => {
//         state.status = "error"
//         state.error = action.payload ?? "Не удалось загрузить карты"
//       })

//     builder
//       .addCase(fetchMapsThunk.pending, (state) => {
//         state.status = "loading"
//         state.error = null
//       })
//       .addCase(fetchMapsThunk.fulfilled, (state, action) => {
//         state.status = "idle"

//         state.maps = action.payload.maps
//         state.page = action.payload.page
//         state.limit = action.payload.limit
//         state.total = action.payload.total
//         state.pages = action.payload.pages
//       })
//       .addCase(fetchMapsThunk.rejected, (state, action) => {
//         state.status = "error"
//         state.error = action.payload ?? "Не удалось загрузить  карты"
//       })
//     builder
//       .addCase(fetchMapByIdThunk.pending, (state) => {
//         state.status = "loading"
//         state.error = null
//       })
//       .addCase(fetchMapByIdThunk.fulfilled, (state, action) => {
//         state.status = "idle"

//         state.currentMap = action.payload.map
//       })
//       .addCase(fetchMapByIdThunk.rejected, (state, action) => {
//         state.status = "error"
//         state.error = action.payload ?? "Не удалось загрузить  карту"
//       })

//     // --- saveMap ---
//     builder
//       .addCase(saveMapThunk.pending, (state) => {
//         state.status = "loading"
//         state.error = null
//       })
//       .addCase(saveMapThunk.fulfilled, (state, action) => {
//         state.status = "idle"
//         state.maps.push(action.payload.map)
//       })
//       .addCase(saveMapThunk.rejected, (state, action) => {
//         state.status = "error"
//         state.error = action.payload ?? "Не удалось сохранить карту"
//       })
//     // --- delMap ---
//     builder
//       .addCase(deleteMapThunk.pending, (state) => {
//         state.status = "loading"
//         state.error = null
//       })
//       .addCase(deleteMapThunk.fulfilled, (state, action) => {
//         state.status = "idle"
//         state.maps = state.maps.filter(
//           (map) => map._id !== action.payload.mapId,
//         )
//         // state.maps.push(action.payload.map)
//       })
//       .addCase(deleteMapThunk.rejected, (state, action) => {
//         state.status = "error"
//         state.error = action.payload ?? "Не удалось сохранить карту"
//       })
//   },
// })

// export const { setGameState, leaveRoom, clearError, clearCurrentMap } =
//   zombicideSlice.actions
// export default zombicideSlice.reducer
