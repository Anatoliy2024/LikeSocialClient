import { createSlice } from "@reduxjs/toolkit"

import {
  changeAvatarUserThunk,
  changeMyProfileThunk,
  getMyProfileThunk,
  getUserProfileThunk,
} from "../thunks/profileThunk"

export type profileState = {
  name: string
  sureName: string
  status: string
  birthDate: string
  address: {
    country: string
    city: string
  }
  relationshipStatus: string
  isMyProfile: boolean
  profileLoading: boolean
  profileError: string | null
  avatar: string
  avatarPublicId: string
}

const initialState: profileState = {
  name: "",
  sureName: "",
  status: "",
  birthDate: "",
  address: {
    country: "",
    city: "",
  },
  relationshipStatus: "",
  isMyProfile: false,
  profileLoading: false,
  profileError: null,
  avatar: "",
  avatarPublicId: "",
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
        const newStateUserInfo = action.payload.userInfo
        state.name = newStateUserInfo.name ?? ""
        state.sureName = newStateUserInfo.sureName ?? ""
        state.status = newStateUserInfo.status ?? ""
        state.birthDate = newStateUserInfo.birthDate ?? ""
        state.relationshipStatus = newStateUserInfo.relationshipStatus ?? ""
        state.address.country = newStateUserInfo.address.country ?? ""
        state.address.city = newStateUserInfo.address.city ?? ""

        // state.sureName = action.payload.userInfo.sureName
        // state.status = action.payload.userInfo.status
        // state.birthDate = action.payload.userInfo.birthDate
        // state.address = action.payload.userInfo.address
        // state.relationshipStatus = action.payload.userInfo.relationshipStatus
        state.isMyProfile = action.payload.isMyProfile
        state.avatar = action.payload.avatar
        state.avatarPublicId = action.payload.avatarPublicId
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
        const newStateUserInfo = action.payload.userInfo
        state.name = newStateUserInfo.name ?? ""
        state.sureName = newStateUserInfo.sureName ?? ""
        state.status = newStateUserInfo.status ?? ""
        state.birthDate = newStateUserInfo.birthDate ?? ""
        state.relationshipStatus = newStateUserInfo.relationshipStatus ?? ""
        state.address.country = newStateUserInfo.address.country ?? ""
        state.address.city = newStateUserInfo.address.city ?? ""

        // state.name = action.payload.userInfo.name
        // state.sureName = action.payload.userInfo.sureName
        // state.status = action.payload.userInfo.status
        // state.birthDate = action.payload.userInfo.birthDate
        // state.address = action.payload.userInfo.address
        // state.relationshipStatus = action.payload.userInfo.relationshipStatus
        state.isMyProfile = action.payload.isMyProfile
        state.avatar = action.payload.avatar
        state.avatarPublicId = action.payload.avatarPublicId
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
        const newStateUserInfo = action.payload.userInfo
        state.name = newStateUserInfo.name ?? ""
        state.sureName = newStateUserInfo.sureName ?? ""
        state.status = newStateUserInfo.status ?? ""
        state.birthDate = newStateUserInfo.birthDate ?? ""
        state.relationshipStatus = newStateUserInfo.relationshipStatus ?? ""
        state.address.country = newStateUserInfo.address.country ?? ""
        state.address.city = newStateUserInfo.address.city ?? ""

        // state.name = action.payload.userInfo.name
        // state.sureName = action.payload.userInfo.sureName
        // state.status = action.payload.userInfo.status
        // state.birthDate = action.payload.userInfo.birthDate
        // state.address = action.payload.userInfo.address
        // state.relationshipStatus = action.payload.userInfo.relationshipStatus
        state.isMyProfile = action.payload.isMyProfile
      })
      .addCase(changeMyProfileThunk.rejected, (state, action) => {
        state.profileLoading = false
        state.profileError = action.payload as string
      })
      .addCase(changeAvatarUserThunk.pending, (state) => {
        state.profileLoading = true
        state.profileError = null
      })
      .addCase(changeAvatarUserThunk.fulfilled, (state, action) => {
        state.profileLoading = false

        state.avatar = action.payload.avatar
        state.avatarPublicId = action.payload.avatarPublicId
      })
      .addCase(changeAvatarUserThunk.rejected, (state, action) => {
        state.profileLoading = false
        state.profileError = action.payload as string
      })
  },
})

// export const { logout } = authSlice.actions
export default profileSlice.reducer
