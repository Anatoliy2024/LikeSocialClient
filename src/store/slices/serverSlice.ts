import { createSlice } from "@reduxjs/toolkit"
import { getStatusServerThunk } from "../thunks/serverThunk"
export type ServerType = {
  statusServer: boolean
  loading: boolean
  error: string | null
}

const initialState: ServerType = {
  statusServer: false,
  loading: false,
  error: null,
}

const serverSlice = createSlice({
  name: "server",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getStatusServerThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getStatusServerThunk.fulfilled, (state, action) => {
        state.loading = false
        state.statusServer = action.payload
      })
      .addCase(getStatusServerThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка при получении статуса сервера"
      })
  },
})

export default serverSlice.reducer
