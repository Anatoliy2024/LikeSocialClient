import { createSlice } from "@reduxjs/toolkit"
import {
  addUserMovieThunk,
  createUserMovieThunk,
  deleteUserMovieThunk,
  fetchMyWantToSeeMoviesThunk,
  fetchMyWatchedMoviesThunk,
  fetchPublicWantToSeeMoviesThunk,
  fetchPublicWatchedMoviesThunk,
  toggleUserMovieStatusThunk,
  updateUserMovieThunk,
  uploadUserMovieAvatarThunk,
} from "../thunks/userMoviesThunk"
export type imageIdType = {
  _id: string
  url: string
  publicId: string
}

export type UserMovieType = {
  _id: string
  title: string
  genres: string[]
  // avatar: string

  content?: string
  status: "wantToSee" | "watched"
  addedAt: Date
  watchedAt?: Date | null
  imageId?: imageIdType | null
}

type userMoviesSliceType = {
  myMovies: {
    wantToSee: UserMovieType[]
    watched: UserMovieType[]
  }
  publicMovies: {
    wantToSee: UserMovieType[]
    watched: UserMovieType[]
  }
  loading: boolean
  error: string | null
  page: number
  limit: number
  total: number
  pages: number
}
const initialState: userMoviesSliceType = {
  myMovies: {
    wantToSee: [],
    watched: [],
  },
  publicMovies: {
    wantToSee: [],
    watched: [],
  },
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  total: 0,
  pages: 0,
}

const userMoviesSlice = createSlice({
  name: "userMovies",
  initialState,
  reducers: {
    clearUserMoviesError: (state) => {
      state.error = null
    },
    clearPublicMovies: (state) => {
      state.publicMovies.wantToSee = []
      state.publicMovies.watched = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createUserMovieThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createUserMovieThunk.fulfilled, (state, action) => {
        state.myMovies.wantToSee = action.payload.userMovies.movies
        state.page = action.payload.userMovies.page
        state.limit = action.payload.userMovies.limit
        state.total = action.payload.userMovies.total
        state.pages = action.payload.userMovies.pages
        state.loading = false
      })
      .addCase(createUserMovieThunk.rejected, (state, action) => {
        state.error =
          action.error.message || "Ошибка при создании поста хочу посмотреть"

        state.loading = false
      })

      .addCase(updateUserMovieThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUserMovieThunk.fulfilled, (state, action) => {
        state.loading = false
        const postData = action.payload.movie
        const listName =
          postData.status === "wantToSee" ? "wantToSee" : "watched"

        state.myMovies[listName] = state.myMovies[listName].map((movie) => {
          return movie._id === postData._id ? postData : movie
        })
      })
      .addCase(updateUserMovieThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка при изменении поста хочу посмотреть"
      })
      .addCase(addUserMovieThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addUserMovieThunk.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(addUserMovieThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка при добавлении поста хочу посмотреть"
      })

      .addCase(deleteUserMovieThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteUserMovieThunk.fulfilled, (state, action) => {
        const updatedUserMovies = action.payload.userMovies.movies
        const status = action.payload.status
        console.log("updatedUserMovies", updatedUserMovies)
        console.log("status*************", status)
        if (status === "wantToSee") {
          state.myMovies.wantToSee = updatedUserMovies
        } else {
          state.myMovies.watched = updatedUserMovies
        }
        // state.myMovies.wantToSee = action.payload.userMovies.movies
        state.page = action.payload.userMovies.page
        state.limit = action.payload.userMovies.limit
        state.total = action.payload.userMovies.total
        state.pages = action.payload.userMovies.pages
        // state.myMovies.wantToSee = action.payload.userMovies
        state.loading = false
      })
      .addCase(deleteUserMovieThunk.rejected, (state, action) => {
        state.error = action.error.message || "Ошибка при удалении поста"

        state.loading = false
      })

      .addCase(toggleUserMovieStatusThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })

      .addCase(toggleUserMovieStatusThunk.fulfilled, (state, action) => {
        // state.items = action.payload
        const updatedUserMovies = action.payload.userMovies.movies
        const status = action.payload.status
        console.log("updatedUserMovies***", updatedUserMovies)
        console.log("status***", status)
        // console.log("updatedUserMovies", updatedUserMovies)
        // console.log("state.myMovies.wantToSee", state.myMovies.wantToSee)
        // console.log("updatedUserMovies", updatedUserMovies)
        // console.log("status", status)
        if (status === "wantToSee") {
          state.myMovies.wantToSee = updatedUserMovies
        } else {
          state.myMovies.watched = updatedUserMovies
        }
        state.page = action.payload.userMovies.page
        state.limit = action.payload.userMovies.limit
        state.total = action.payload.userMovies.total
        state.pages = action.payload.userMovies.pages

        // state.myMovies.wantToSee = state.myMovies.wantToSee.filter(
        //   (userMovie) => userMovie._id !== updatedUserMovies._id
        // )
        state.loading = false
      })
      .addCase(toggleUserMovieStatusThunk.rejected, (state, action) => {
        state.error =
          action.error.message ||
          "Ошибка при изменении поста хочу посмотреть на просмотрено"

        state.loading = false
      })

      .addCase(fetchMyWantToSeeMoviesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })

      .addCase(fetchMyWantToSeeMoviesThunk.fulfilled, (state, action) => {
        // state.items = action.payload
        const updatedUserMovies = action.payload.userMovies.movies
        console.log(
          "updatedUserMovies***************",
          action.payload.userMovies
        )
        state.myMovies.wantToSee = updatedUserMovies
        state.page = action.payload.userMovies.page
        state.limit = action.payload.userMovies.limit
        state.total = action.payload.userMovies.total
        state.pages = action.payload.userMovies.pages
        state.loading = false
      })
      .addCase(fetchMyWantToSeeMoviesThunk.rejected, (state, action) => {
        state.error =
          action.error.message ||
          "Ошибка при получении моих постов хочу посмотреть"

        state.loading = false
      })

      .addCase(fetchMyWatchedMoviesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })

      .addCase(fetchMyWatchedMoviesThunk.fulfilled, (state, action) => {
        // state.items = action.payload
        const updatedUserMovies = action.payload.userMovies.movies
        state.myMovies.watched = updatedUserMovies

        state.page = action.payload.userMovies.page
        state.limit = action.payload.userMovies.limit
        state.total = action.payload.userMovies.total
        state.pages = action.payload.userMovies.pages

        state.loading = false
      })
      .addCase(fetchMyWatchedMoviesThunk.rejected, (state, action) => {
        state.error =
          action.error.message ||
          "Ошибка при получении моих постов просмотрено "

        state.loading = false
      })

      .addCase(fetchPublicWantToSeeMoviesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })

      .addCase(fetchPublicWantToSeeMoviesThunk.fulfilled, (state, action) => {
        // state.items = action.payload
        const updatedUserMovies = action.payload.userMovies.movies
        state.publicMovies.wantToSee = updatedUserMovies
        state.page = action.payload.userMovies.page
        state.limit = action.payload.userMovies.limit
        state.total = action.payload.userMovies.total
        state.pages = action.payload.userMovies.pages
        state.loading = false
      })
      .addCase(fetchPublicWantToSeeMoviesThunk.rejected, (state, action) => {
        state.error =
          action.error.message ||
          "Ошибка при получении  постов юзера хочу посмотреть"

        state.loading = false
      })

      .addCase(fetchPublicWatchedMoviesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })

      .addCase(fetchPublicWatchedMoviesThunk.fulfilled, (state, action) => {
        // state.items = action.payload
        const updatedUserMovies = action.payload.userMovies.movies
        state.publicMovies.watched = updatedUserMovies

        state.page = action.payload.userMovies.page
        state.limit = action.payload.userMovies.limit
        state.total = action.payload.userMovies.total
        state.pages = action.payload.userMovies.pages
        state.loading = false
      })
      .addCase(fetchPublicWatchedMoviesThunk.rejected, (state, action) => {
        state.error =
          action.error.message ||
          "Ошибка при получении  постов юзера просмотрено"

        state.loading = false
      })

      .addCase(uploadUserMovieAvatarThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(uploadUserMovieAvatarThunk.fulfilled, (state, action) => {
        const updateUserMovie = action.payload.userMovie
        const status = action.payload.status
        console.log("updateUserMovie***", updateUserMovie)
        console.log("status***", status)
        if (status === "wantToSee") {
          state.myMovies.wantToSee = state.myMovies.wantToSee.map((userMovie) =>
            userMovie._id === updateUserMovie._id ? updateUserMovie : userMovie
          )
        } else {
          state.myMovies.watched = state.myMovies.watched.map((userMovie) =>
            userMovie._id === updateUserMovie._id ? updateUserMovie : userMovie
          )
        }

        state.loading = false
      })
      .addCase(uploadUserMovieAvatarThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка при изменении аватарки room поста"
      })
  },
})
export const { clearUserMoviesError, clearPublicMovies } =
  userMoviesSlice.actions
export default userMoviesSlice.reducer
