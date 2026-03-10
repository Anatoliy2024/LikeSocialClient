// import { createSlice } from "@reduxjs/toolkit"
// import {
//   deletePushDeviceThunk,
//   fetchAllPushDevicesThunk,
// } from "../thunks/pushDevicesThunk"

// export interface PushDevice {
//   _id: string
//   endpoint: string
//   userAgent?: string
//   browser?: string // "Chrome", "Firefox"
//   os?: string // "Windows", "Android"
//   createdAt: string
//   lastActive?: string
// }

// interface PushDevicesState {
//   devices: PushDevice[]
//   loading: boolean
//   error: string | null
//   lastFetched: string | null
// }

// const initialState: PushDevicesState = {
//   devices: [],
//   loading: false,
//   error: null,
//   lastFetched: null,
// }

// const pushDevicesSlice = createSlice({
//   name: "profile",
//   initialState,
//   reducers: {
//     // Очистить список (при логауте)
//     clearDevices: (state) => {
//       state.devices = []
//       state.lastFetched = null
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchAllPushDevicesThunk.pending, (state) => {
//         state.loading = true
//         state.error = null
//       })
//       .addCase(fetchAllPushDevicesThunk.fulfilled, (state, action) => {
//         state.loading = false
//         const data = action.payload
//         if (data.success && data.devices) {
//           state.devices = data.devices
//         }
//       })
//       .addCase(fetchAllPushDevicesThunk.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload as string
//       })
//       .addCase(deletePushDeviceThunk.pending, (state) => {
//         state.loading = true
//         state.error = null
//       })
//       .addCase(deletePushDeviceThunk.fulfilled, (state, action) => {
//         state.loading = false
//         state.devices = state.devices.filter(
//           (devices) => devices._id !== action.payload.deviceId,
//         )
//         // state.isSubscribed = action.payload.isSubscribed
//       })
//       .addCase(deletePushDeviceThunk.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.payload as string
//       })
//   },
// })

// export const { clearDevices } = pushDevicesSlice.actions
// export default pushDevicesSlice.reducer
