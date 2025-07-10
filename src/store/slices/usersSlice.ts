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

import { UserTypeReq } from "../thunks/usersThunk"
type InitialStateUserType = {
  users: UserTypeReq
  loading: boolean
  error: string | null
  friendRequests: UserTypeReq
  friends: UserTypeReq
  sentFriendRequests: UserTypeReq
}

const initialState: InitialStateUserType = {
  users: {
    users: [],
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  loading: false,
  error: null,
  friendRequests: {
    users: [],
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  friends: { users: [], page: 1, limit: 10, total: 0, pages: 0 },
  sentFriendRequests: { users: [], page: 1, limit: 10, total: 0, pages: 0 },
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

        // state.users.users = action.payload.users
        // state.users.page = action.payload.page
        // state.users.limit = action.payload.limit
        // state.users.total = action.payload.total
        // state.users.pages = action.payload.pages
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
        // const data = action.payload
        if (type.type === "requests") {
          // const friendRequests = state.friendRequests
          state.friendRequests = action.payload
          // friendRequests.users = data.users
          // friendRequests.page = data.page
          // friendRequests.limit = data.limit
          // friendRequests.total = data.total
          // friendRequests.pages = data.pages
        } else if (type.type === "friends") {
          state.friends = action.payload
          // const friends = state.friends

          // friends.users = data.users
          // friends.page = data.page
          // friends.limit = data.limit
          // friends.total = data.total
          // friends.pages = data.pages
        } else if (type.type === "sent") {
          state.sentFriendRequests = action.payload

          // const sentFriendRequests = state.sentFriendRequests

          // sentFriendRequests.users = data.users
          // sentFriendRequests.page = data.page
          // sentFriendRequests.limit = data.limit
          // sentFriendRequests.total = data.total
          // sentFriendRequests.pages = data.pages
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

        // state.sentFriendRequests.users = action.payload.users
        // state.sentFriendRequests.page = action.payload.page
        // state.sentFriendRequests.limit = action.payload.limit
        // state.sentFriendRequests.total = action.payload.total
        // state.sentFriendRequests.pages = action.payload.pages
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
        // const stateFriends = state.friends
        // const friends = action.payload.friends

        // const stateFriendRequests = state.friendRequests
        // const friendRequests = action.payload.friendRequests

        // stateFriends.users = friends.users
        // stateFriends.page = friends.page
        // stateFriends.limit = friends.limit
        // stateFriends.total = friends.total
        // stateFriends.pages = friends.pages

        // stateFriendRequests.users = friendRequests.users
        // stateFriendRequests.page = friendRequests.page
        // stateFriendRequests.limit = friendRequests.limit
        // stateFriendRequests.total = friendRequests.total
        // stateFriendRequests.pages = friendRequests.pages
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

        // state.friends.users = action.payload.users
        // state.friends.page = action.payload.page
        // state.friends.limit = action.payload.limit
        // state.friends.total = action.payload.total
        // state.friends.pages = action.payload.pages
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

        // state.sentFriendRequests.users = action.payload.users
        // state.sentFriendRequests.page = action.payload.page
        // state.sentFriendRequests.limit = action.payload.limit
        // state.sentFriendRequests.total = action.payload.total
        // state.sentFriendRequests.pages = action.payload.pages
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
