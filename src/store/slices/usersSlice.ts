// store/slices/postSlice.ts
import { createSlice } from "@reduxjs/toolkit"
import {
  acceptFriendThunk,
  cancelRequestFriendThunk,
  delFriendThunk,
  getAllUsersThunk,
  getMyFriendsIdThunk,
  getUserRelationsThunk,
  requestFriendThunk,
} from "../thunks/usersThunk"

const initialState = {
  users: [],
  loading: false,
  error: null as string | null,
  friendRequests: [] as any[],
  friends: [] as any[],
  sentFriendRequests: [] as any[],
}

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllUsersThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getAllUsersThunk.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload
      })
      .addCase(getAllUsersThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при запросе всех юзеров"
      })

      // Универсальный thunk на получение друзей и заявок
      .addCase(getUserRelationsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getUserRelationsThunk.fulfilled, (state, action) => {
        state.loading = false
        // тут в meta.arg придёт type запроса
        const type = action.meta.arg
        if (type === "requests") {
          state.friendRequests = action.payload
        } else if (type === "friends") {
          state.friends = action.payload
        } else if (type === "sent") {
          state.sentFriendRequests = action.payload
        }
      })

      .addCase(getUserRelationsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Ошибка при получении данных"
      })

      //отправка запроса на дружбу
      .addCase(requestFriendThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(requestFriendThunk.fulfilled, (state, action) => {
        state.loading = false
        state.sentFriendRequests = action.payload
      })
      .addCase(requestFriendThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка при отправке запроса в друзья"
      })
      //добавление друга
      .addCase(acceptFriendThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(acceptFriendThunk.fulfilled, (state, action) => {
        state.loading = false
        state.friends = action.payload.friends
        state.friendRequests = action.payload.friendRequests
      })
      .addCase(acceptFriendThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при добавлении друга"
      })

      //удаление друга
      .addCase(delFriendThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(delFriendThunk.fulfilled, (state, action) => {
        state.loading = false
        state.friends = action.payload
      })
      .addCase(delFriendThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при удалении друга"
      })

      //отмена запроса в друзья
      .addCase(cancelRequestFriendThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(cancelRequestFriendThunk.fulfilled, (state, action) => {
        state.loading = false
        state.sentFriendRequests = action.payload
      })
      .addCase(cancelRequestFriendThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка при отмене запроса в друга"
      })
      //запрос на получении всех id friends
      .addCase(getMyFriendsIdThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMyFriendsIdThunk.fulfilled, (state, action) => {
        state.loading = false
        state.friendRequests = action.payload.friendRequests
        state.friends = action.payload.friends
        state.sentFriendRequests = action.payload.sentFriendRequests
      })
      .addCase(getMyFriendsIdThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message ||
          "Ошибка при запрос на получении всех id friends"
      })
  },
})

export default usersSlice.reducer
