// store/slices/postSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
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
export type authorIdType = {
  username: string
  avatar: string
  _id: string
}

export type userPostType = {
  _id: string
  authorId: authorIdType
  imagePost?: string
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
  avatar: string
  avatarPublicId: string
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
  page: number
  limit: number
  total: number
  pages: number
}

const initialState: userPostState = {
  posts: [],
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
}

const userPostSlice = createSlice({
  name: "roomPost",
  initialState,
  reducers: {
    setUserPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createUserPostThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createUserPostThunk.fulfilled, (state, action) => {
        state.loading = false
        state.posts = action.payload.posts
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.total = action.payload.total
        state.pages = action.payload.pages

        // state.posts.unshift(action.payload) // добавим новый пост в начало
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
        // state.posts = action.payload
        state.posts = action.payload.posts
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.total = action.payload.total
        state.pages = action.payload.pages
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
        // state.posts = action.payload

        state.posts = action.payload.posts
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.total = action.payload.total
        state.pages = action.payload.pages
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
        // state.posts = action.payload

        state.posts = action.payload.posts
        state.page = action.payload.page
        state.limit = action.payload.limit
        state.total = action.payload.total
        state.pages = action.payload.pages
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
export const { setUserPage } = userPostSlice.actions
export default userPostSlice.reducer
