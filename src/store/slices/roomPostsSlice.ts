// store/slices/postSlice.ts
import { createSlice } from "@reduxjs/toolkit"
import {
  createRoomCommentThunk,
  createRoomPostThunk,
  delRoomPostsThunk,
  getRoomPostsThunk,
} from "../thunks/roomPostThunk"

export type RatingType = {
  acting: number
  specialEffects: number
  story: number
}

export type roomPostType = {
  _id: string
  authorId: string
  imagePost: string
  // roomId: string | null
  title: string
  content: string | null
  votesCount: number
  ratings: RatingType
  comments: userCommentType[]
  genres: string[]
  showOnProfile: boolean
  createdAt: string
  updatedAt: string
  roomId?: string
  authorName?: string
}

export type userCommentType = {
  _id: string
  userId: {
    _id?: string
    username: string
    avatar: string
  }
  text: string
  createdAt: string
}

type roomPostState = {
  posts: roomPostType[]
  loading: boolean
  error: string | null
}

const initialState: roomPostState = {
  posts: [],
  loading: false,
  error: null,
}

const roomPostSlice = createSlice({
  name: "userPost",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createRoomPostThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createRoomPostThunk.fulfilled, (state, action) => {
        state.loading = false
        state.posts = action.payload // добавим новый пост в начало
      })
      .addCase(createRoomPostThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при создании поста"
      })

      .addCase(getRoomPostsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getRoomPostsThunk.fulfilled, (state, action) => {
        console.log("getRoomPostsThunk", action.payload)
        state.loading = false
        state.posts = action.payload
      })
      .addCase(getRoomPostsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при загрузке постов"
      })

      .addCase(delRoomPostsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(delRoomPostsThunk.fulfilled, (state, action) => {
        console.log("delRoomPostsThunk", action.payload)
        state.loading = false
        state.posts = action.payload
      })
      .addCase(delRoomPostsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при загрузке постов"
      })

      .addCase(createRoomCommentThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createRoomCommentThunk.fulfilled, (state, action) => {
        console.log("createRoomCommentThunk", action.payload)
        state.loading = false
        const updatedPost = action.payload
        state.posts = state.posts.map((post) =>
          post._id === updatedPost._id ? updatedPost : post
        )
        //  action.payload
        // state.rooms = state.rooms.map((room) =>
        //   room._id === updatedRoom.room._id ? updatedRoom.room : room
        // )
      })
      .addCase(createRoomCommentThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при создании комментария"
      })
  },
})

export default roomPostSlice.reducer
