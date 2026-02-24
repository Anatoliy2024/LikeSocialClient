// slices/adminSlice.ts
import { createSlice } from "@reduxjs/toolkit"
import { createTestUserThunk } from "../thunks/adminThunk"
// import { createTestUserThunk } from "../thunks/adminThunk"

type CreatedTestUser = {
  username: string
  password: string
  id: string
}

type AdminState = {
  loading: boolean
  error: string | null
  lastCreatedUser: CreatedTestUser | null
}

const initialState: AdminState = {
  loading: false,
  error: null,
  lastCreatedUser: null,
}

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null
    },
    clearLastCreatedUser: (state) => {
      state.lastCreatedUser = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTestUserThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTestUserThunk.fulfilled, (state, action) => {
        state.loading = false
        state.lastCreatedUser = action.payload
      })
      .addCase(createTestUserThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearAdminError, clearLastCreatedUser } = adminSlice.actions
export default adminSlice.reducer
