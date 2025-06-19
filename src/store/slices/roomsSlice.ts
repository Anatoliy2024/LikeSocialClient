// store/slices/postSlice.ts
import { createSlice } from "@reduxjs/toolkit"

import {
  addFriendsToRoomThunk,
  createRoomThunk,
  delFriendFromRoomThunk,
  delRoomThunk,
  getMembersFromRoomThunk,
  getRoomsThunk,
  leaveRoomThunk,
} from "../thunks/roomsThunk"

const initialState = {
  rooms: [],
  members: [],
  owner: null,
  loading: false,
  error: null as string | null,
}

const roomsSlice = createSlice({
  name: "rooms",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createRoomThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createRoomThunk.fulfilled, (state, action) => {
        state.loading = false
        state.rooms = action.payload
      })
      .addCase(createRoomThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при создании комнаты"
      })

      .addCase(getRoomsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getRoomsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.rooms = action.payload
      })
      .addCase(getRoomsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при получении комнат"
      })

      .addCase(getMembersFromRoomThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMembersFromRoomThunk.fulfilled, (state, action) => {
        state.loading = false
        state.members = action.payload.members
        state.owner = action.payload.owner
      })
      .addCase(getMembersFromRoomThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка при получении участников комнаты"
      })

      .addCase(addFriendsToRoomThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addFriendsToRoomThunk.fulfilled, (state, action) => {
        state.loading = false
        const updatedRoom = action.payload
        state.rooms = state.rooms.map((room) =>
          room._id === updatedRoom.room._id ? updatedRoom.room : room
        )
        state.members = action.payload.members
        state.owner = action.payload.owner

        // state.loading = false
        // const updatedRoom = action.payload
        // state.rooms = state.rooms.map((room) =>
        //   room._id === updatedRoom._id ? updatedRoom : room
        // )
      })
      .addCase(addFriendsToRoomThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка при добавлении друга в комнату"
      })
      .addCase(delFriendFromRoomThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(delFriendFromRoomThunk.fulfilled, (state, action) => {
        state.loading = false
        const updatedRoom = action.payload
        state.rooms = state.rooms.map((room) =>
          room._id === updatedRoom.room._id ? updatedRoom.room : room
        )
        state.members = action.payload.members
        state.owner = action.payload.owner

        // state.loading = false
        // const updatedRoom = action.payload

        // state.rooms = state.rooms.map((room) =>
        //   room._id === updatedRoom._id ? updatedRoom : room
        // )
      })
      .addCase(delFriendFromRoomThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка при удалении друга из комнаты"
      })

      .addCase(delRoomThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(delRoomThunk.fulfilled, (state, action) => {
        state.loading = false
        state.rooms = action.payload
      })
      .addCase(delRoomThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при удалении комнаты"
      })
      .addCase(leaveRoomThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(leaveRoomThunk.fulfilled, (state, action) => {
        state.loading = false
        state.rooms = action.payload
      })
      .addCase(leaveRoomThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при выходе из комнаты"
      })
  },
})

export default roomsSlice.reducer
