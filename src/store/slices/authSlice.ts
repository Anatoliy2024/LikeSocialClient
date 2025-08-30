import { createSlice } from "@reduxjs/toolkit"
import {
  authCheckThunk,
  authThunk,
  logoutThunk,
  registerThunk,
  verifyThunk,
} from "../thunks/authThunk"

type AuthAState = {
  isAuth: boolean
  username: string | null
  avatar: string | null | undefined
  userId: string | null
  authLoading: boolean
  authError: string | null
  isVerified: boolean
}

const initialState: AuthAState = {
  isAuth: false,
  username: null,
  avatar: null,
  userId: null,
  authLoading: false,
  authError: null,
  isVerified: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.authError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerThunk.pending, (state) => {
        state.authLoading = true
        state.authError = null
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.authLoading = false

        state.isAuth = true
        state.username = action.payload.username
        state.avatar = action.payload.avatar
        state.userId = action.payload.userId
        state.isVerified = action.payload.isVerified
        state.avatar = action.payload.avatar
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.authLoading = false
        state.authError = action.payload as string
      })

      //authThunk
      .addCase(authThunk.pending, (state) => {
        state.authLoading = true
        state.authError = null
      })
      .addCase(authThunk.fulfilled, (state, action) => {
        state.authLoading = false

        state.isAuth = true
        console.log("action.payload", action.payload)
        state.username = action.payload.username
        state.avatar = action.payload.avatar
        state.userId = action.payload.userId
        state.isVerified = action.payload.isVerified
      })
      .addCase(authThunk.rejected, (state, action) => {
        state.authLoading = false
        state.authError = action.payload as string
      })

      //verifyThunk
      .addCase(verifyThunk.pending, (state) => {
        state.authLoading = true
        state.authError = null
      })
      .addCase(verifyThunk.fulfilled, (state, action) => {
        state.authLoading = false
        state.isVerified = action.payload.isVerified
      })
      .addCase(verifyThunk.rejected, (state, action) => {
        state.authLoading = false
        state.authError = action.payload as string
      })
      .addCase(authCheckThunk.pending, (state) => {
        state.authLoading = true
        state.authError = null
      })
      .addCase(authCheckThunk.fulfilled, (state, action) => {
        state.authLoading = false
        state.isAuth = true
        state.username = action.payload.username
        state.avatar = action.payload.avatar
        state.userId = action.payload.userId
        state.isVerified = action.payload.isVerified
      })
      .addCase(authCheckThunk.rejected, (state, action) => {
        state.authLoading = false
        state.authError = action.payload as string
      })
      //logout
      .addCase(logoutThunk.pending, (state) => {
        state.authLoading = true
        state.authError = null
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.authLoading = false
        state.isAuth = false

        state.username = null
        state.avatar = null
        state.userId = null
        state.isVerified = false
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.authLoading = false
        state.authError = action.payload as string
      })
  },
})

// export const { logout } = authSlice.actions
export const { clearAuthError } = authSlice.actions
export default authSlice.reducer
