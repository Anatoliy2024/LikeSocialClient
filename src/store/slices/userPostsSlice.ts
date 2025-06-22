// store/slices/postSlice.ts
import { createSlice } from "@reduxjs/toolkit"
import {
  createUserCommentThunk,
  createUserPostThunk,
  delUserPostsThunk,
  getUserPostsByIdThunk,
  getUserPostsThunk,
  uploadUserPostAvatarThunk,
} from "../thunks/userPostThunk"

export type RatingType = {
  acting: number
  specialEffects: number
  story: number
  stars: number
}

export type userPostType = {
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

type userCommentType = {
  _id: string
  userId: {
    _id?: string
    username: string
    avatar: string
  }
  text: string
  createdAt: string
}

type userPostState = {
  posts: userPostType[]
  loading: boolean
  error: string | null
}

const initialState: userPostState = {
  posts: [],
  loading: false,
  error: null,
}

const userPostSlice = createSlice({
  name: "roomPost",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createUserPostThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createUserPostThunk.fulfilled, (state, action) => {
        state.loading = false
        state.posts.unshift(action.payload) // добавим новый пост в начало
      })
      .addCase(createUserPostThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при создании поста"
      })

      .addCase(getUserPostsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getUserPostsThunk.fulfilled, (state, action) => {
        console.log("getUserPostsThunk", action.payload)
        state.loading = false
        state.posts = action.payload
      })
      .addCase(getUserPostsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при загрузке постов"
      })
      .addCase(getUserPostsByIdThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getUserPostsByIdThunk.fulfilled, (state, action) => {
        console.log("getUserPostsByIdThunk", action.payload)
        state.loading = false
        state.posts = action.payload
      })
      .addCase(getUserPostsByIdThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при загрузке постов по id"
      })

      .addCase(delUserPostsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(delUserPostsThunk.fulfilled, (state, action) => {
        console.log("delUserPostsThunk", action.payload)
        state.loading = false
        state.posts = action.payload
      })
      .addCase(delUserPostsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при загрузке постов"
      })
      .addCase(createUserCommentThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createUserCommentThunk.fulfilled, (state, action) => {
        console.log("createUserCommentThunk", action.payload)
        state.loading = false
        const updatedPost = action.payload
        // console.log("createUserCommentThunk", action.payload)
        state.posts = state.posts.map((post) =>
          post._id === updatedPost._id ? updatedPost : post
        )
        //  action.payload
        // state.rooms = state.rooms.map((room) =>
        //   room._id === updatedRoom.room._id ? updatedRoom.room : room
        // )
      })
      .addCase(createUserCommentThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при создании комментария"
      })
      .addCase(uploadUserPostAvatarThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(uploadUserPostAvatarThunk.fulfilled, (state, action) => {
        console.log("createUserCommentThunk", action.payload)
        state.loading = false
        const updatedPost = action.payload
        // console.log("createUserCommentThunk", action.payload)
        state.posts = state.posts.map((post) =>
          post._id === updatedPost._id ? updatedPost : post
        )
      })
      .addCase(uploadUserPostAvatarThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка при изменении аватарки user пост"
      })
  },
})

export default userPostSlice.reducer
