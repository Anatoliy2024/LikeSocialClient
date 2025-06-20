import { createSlice } from "@reduxjs/toolkit"

import {
  changeMyProfileThunk,
  getMyProfileThunk,
  getUserProfileThunk,
} from "../thunks/profileThunk"

export type profileState = {
  name: string | null
  sureName: string | null
  status: string | null
  age: string | null
  address: {
    country: string | null
    city: string | null
  }
  relationshipStatus: string | null
  isMyProfile: boolean
  profileLoading: boolean
  profileError: string | null
}

const initialState: profileState = {
  name: null,
  sureName: null,
  status: null,
  age: null,
  address: {
    country: null,
    city: null,
  },
  relationshipStatus: null,
  isMyProfile: false,
  profileLoading: false,
  profileError: null,
}

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      //getUserProfileThunk
      .addCase(getMyProfileThunk.pending, (state) => {
        state.profileLoading = true
        state.profileError = null
      })
      .addCase(getMyProfileThunk.fulfilled, (state, action) => {
        state.profileLoading = false
        console.log("action.payload", action.payload)

        state.name = action.payload.userInfo.name
        state.sureName = action.payload.userInfo.sureName
        state.status = action.payload.userInfo.status
        state.age = action.payload.userInfo.age
        state.address = action.payload.userInfo.address
        state.relationshipStatus = action.payload.userInfo.relationshipStatus
        state.isMyProfile = action.payload.isMyProfile
      })

      .addCase(getMyProfileThunk.rejected, (state, action) => {
        state.profileLoading = false
        state.profileError = action.payload as string
      })
      //getUserProfileThunk
      .addCase(getUserProfileThunk.pending, (state) => {
        state.profileLoading = true
        state.profileError = null
      })
      .addCase(getUserProfileThunk.fulfilled, (state, action) => {
        state.profileLoading = false
        console.log("action.payload", action.payload)

        state.name = action.payload.userInfo.name
        state.sureName = action.payload.userInfo.sureName
        state.status = action.payload.userInfo.status
        state.age = action.payload.userInfo.age
        state.address = action.payload.userInfo.address
        state.relationshipStatus = action.payload.userInfo.relationshipStatus
        state.isMyProfile = action.payload.isMyProfile
      })
      .addCase(getUserProfileThunk.rejected, (state, action) => {
        state.profileLoading = false
        state.profileError = action.payload as string
      })
      //changeMyProfileThunk
      .addCase(changeMyProfileThunk.pending, (state) => {
        state.profileLoading = true
        state.profileError = null
      })
      .addCase(changeMyProfileThunk.fulfilled, (state, action) => {
        state.profileLoading = false
        console.log("action.payload", action.payload)
        state.name = action.payload.userInfo.name
        state.sureName = action.payload.userInfo.sureName
        state.status = action.payload.userInfo.status
        state.age = action.payload.userInfo.age
        state.address = action.payload.userInfo.address
        state.relationshipStatus = action.payload.userInfo.relationshipStatus
        state.isMyProfile = action.payload.isMyProfile
      })
      .addCase(changeMyProfileThunk.rejected, (state, action) => {
        state.profileLoading = false
        state.profileError = action.payload as string
      })
  },
})

// export const { logout } = authSlice.actions
export default profileSlice.reducer
