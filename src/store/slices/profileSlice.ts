import { createSlice } from "@reduxjs/toolkit"

import {
  changeAvatarUserThunk,
  changeMyProfileThunk,
  getMyProfileThunk,
  getUserProfileThunk,
  subscribeToUserThunk,
  unsubscribeFromUserThunk,
} from "../thunks/profileThunk"
import { UserType } from "../thunks/usersThunk"

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
  isSubscribed: boolean
  // friendshipStatus: "friend" | "incoming" | "outgoing" | "none" | null
  subscriptions: UserType[] // на кого подписан
  subscribers: UserType[] // кто подписался
  isOnline?: boolean
  lastSeen?: string | null
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
  subscriptions: [],
  subscribers: [],
  isSubscribed: false,
  // friendshipStatus: null,
  isOnline: false,
  lastSeen: null,
}

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.name = ""
      state.sureName = ""
      state.status = ""
      state.birthDate = ""
      state.address = {
        country: "",
        city: "",
      }
      state.relationshipStatus = ""
      state.isMyProfile = false
      state.profileLoading = false
      state.profileError = null
      state.avatarPublicId = ""
      state.subscriptions = []
      state.subscribers = []
      state.isSubscribed = false
      // state.friendshipStatus = null
      state.isOnline = false
      state.lastSeen = null
    },
  },
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

        state.isMyProfile = action.payload.isMyProfile
        state.avatar = action.payload.avatar
        state.avatarPublicId = action.payload.avatarPublicId
        state.subscriptions = action.payload.subscriptions
        state.subscribers = action.payload.subscribers
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

        state.isMyProfile = action.payload.isMyProfile
        state.avatar = action.payload.avatar
        state.avatarPublicId = action.payload.avatarPublicId
        state.isSubscribed = action.payload.isSubscribed
        // state.friendshipStatus = action.payload.friendshipStatus
        state.isOnline = action.payload.isOnline
        state.lastSeen = action.payload.lastSeen

        // state.subscriptions = action.payload.subscriptions
        // state.subscribers = action.payload.subscribers
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

      .addCase(subscribeToUserThunk.pending, (state) => {
        state.profileLoading = true
        state.profileError = null
      })
      .addCase(subscribeToUserThunk.fulfilled, (state, action) => {
        state.profileLoading = false

        state.isSubscribed = action.payload.isSubscribed
      })
      .addCase(subscribeToUserThunk.rejected, (state, action) => {
        state.profileLoading = false
        state.profileError = action.payload as string
      })

      .addCase(unsubscribeFromUserThunk.pending, (state) => {
        state.profileLoading = true
        state.profileError = null
      })
      .addCase(unsubscribeFromUserThunk.fulfilled, (state, action) => {
        state.profileLoading = false
        state.isSubscribed = action.payload.isSubscribed
      })
      .addCase(unsubscribeFromUserThunk.rejected, (state, action) => {
        state.profileLoading = false
        state.profileError = action.payload as string
      })
  },
})

export const { clearProfile } = profileSlice.actions
export default profileSlice.reducer
