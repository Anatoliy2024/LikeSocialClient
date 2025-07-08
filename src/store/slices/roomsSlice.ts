// store/slices/postSlice.ts
import { createSlice } from "@reduxjs/toolkit"

import {
  addFriendsToRoomThunk,
  changeAvatarRoomThunk,
  createRoomThunk,
  delFriendFromRoomThunk,
  delRoomThunk,
  getRoomByIdThunk,
  getRoomsThunk,
  leaveRoomThunk,
  OwnerType,
  RoomMemberType,
  RoomType,
} from "../thunks/roomsThunk"

const initialState = {
  rooms: [] as RoomType[],
  members: [] as RoomMemberType[],
  owner: null as OwnerType,
  room: null as null | RoomType,
  loading: false,
  error: null as string | null,
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
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
        state.rooms = action.payload.rooms
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.total = action.payload.total
        state.pages = action.payload.pages
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
        // state.rooms = action.payload
        state.rooms = action.payload.rooms
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.total = action.payload.total
        state.pages = action.payload.pages
      })
      .addCase(getRoomsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при получении комнат"
      })

      .addCase(getRoomByIdThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getRoomByIdThunk.fulfilled, (state, action) => {
        state.loading = false
        state.room = action.payload
        // state.members = action.payload.members
        // state.owner = action.payload.owner
      })
      .addCase(getRoomByIdThunk.rejected, (state, action) => {
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
        const newRoom = action.payload
        // updatedRoom

        state.rooms = state.rooms.map((room) =>
          room._id === newRoom._id ? newRoom : room
        )
        state.members = newRoom.members
        state.owner = newRoom.owner

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
        const newRoom = action.payload
        state.rooms = state.rooms.map((room) =>
          room._id === newRoom._id ? newRoom : room
        )
        state.members = newRoom.members
        state.owner = newRoom.owner

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
        // state.rooms = action.payload
        state.rooms = action.payload.rooms
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.total = action.payload.total
        state.pages = action.payload.pages
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
        // state.rooms = action.payload
        state.rooms = action.payload.rooms
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.total = action.payload.total
        state.pages = action.payload.pages
      })
      .addCase(leaveRoomThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при выходе из комнаты"
      })
      .addCase(changeAvatarRoomThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(changeAvatarRoomThunk.fulfilled, (state, action) => {
        state.loading = false

        if (state.room) {
          state.room.avatar = action.payload.avatar
          state.room.avatarPublicId = action.payload.avatarPublicId
        }
      })
      .addCase(changeAvatarRoomThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка при смене аватарки комнаты"
      })
  },
})

export default roomsSlice.reducer
