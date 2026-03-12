import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export type CallStatus =
  | "idle"
  | "calling"
  | "incoming"
  | "inCall"
  | "reconnecting"
  | "failed"
  | "ended"

interface CallState {
  status: CallStatus
  callerId: string | null
  avatarCaller: string | null
  usernameCaller: string | null
  targetId: string | null
  targetAvatar: string | null
  targetUsername: string | null
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  callStartedAt: number | null // timestamp для таймера
  reconnectAttempt: number // счётчик попыток переподключения
}

const initialState: CallState = {
  status: "idle",
  callerId: null,
  avatarCaller: null,
  usernameCaller: null,
  targetId: null,
  targetAvatar: null,
  targetUsername: null,
  isAudioEnabled: true,
  isVideoEnabled: false,
  callStartedAt: null,
  reconnectAttempt: 0,
}

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    startCall: (
      state,
      action: PayloadAction<{
        peerId: string
        avatar?: string
        username?: string
      }>,
    ) => {
      state.status = "calling"
      state.targetId = action.payload.peerId
      state.targetAvatar = action.payload.avatar ?? null
      state.targetUsername = action.payload.username ?? null
    },
    setIncomingCall: (
      state,
      action: PayloadAction<{
        callerId: string
        avatar: string
        username: string
      }>,
    ) => {
      state.status = "incoming"
      state.callerId = action.payload.callerId
      state.avatarCaller = action.payload.avatar
      state.usernameCaller = action.payload.username
    },
    setCallStatus: (state, action: PayloadAction<CallState["status"]>) => {
      state.status = action.payload
    },
    acceptCall: (state) => {
      state.status = "inCall"
      state.callStartedAt = Date.now()
      state.reconnectAttempt = 0
    },
    clearIncomingCall: (state) => {
      state.status = "idle"
      state.targetId = null
      state.targetAvatar = null
      state.targetUsername = null
      state.callerId = null
      state.avatarCaller = null
      state.usernameCaller = null
      state.isAudioEnabled = true
      state.isVideoEnabled = false
      state.callStartedAt = null
      state.reconnectAttempt = 0
    },
    toggleAudio: (state) => {
      state.isAudioEnabled = !state.isAudioEnabled
    },
    toggleVideo: (state) => {
      state.isVideoEnabled = !state.isVideoEnabled
    },
    setReconnecting: (state) => {
      state.status = "reconnecting"
      state.reconnectAttempt += 1
    },
    setReconnected: (state) => {
      state.status = "inCall"
    },
  },
})

export const {
  setIncomingCall,
  clearIncomingCall,
  startCall,
  setCallStatus,
  acceptCall,
  toggleAudio,
  toggleVideo,
  setReconnecting,
  setReconnected,
} = callSlice.actions

export default callSlice.reducer

// import { createSlice } from "@reduxjs/toolkit"

// export type CallStatus = "calling" | "incoming" | "inCall" | ""
// interface CallState {
//   status: CallStatus
//   callerId: string | null
//   avatarCaller: string | null // кто звонит,,
//   usernameCaller: string | null // кто звонит,,
//   targetId: string | null
// }

// const initialState: CallState = {
//   status: "",
//   callerId: null, // кто звонит,,
//   avatarCaller: null, // кто звонит,,
//   usernameCaller: null, // кто звонит,
//   targetId: null, // кому звоним
// }

// const callSlice = createSlice({
//   name: "call",
//   initialState,
//   reducers: {
//     startCall: (state, action) => {
//       state.status = "calling"
//       state.targetId = action.payload.peerId
//     },
//     setIncomingCall: (state, action) => {
//       state.status = "incoming"
//       state.callerId = action.payload.callerId
//       state.avatarCaller = action.payload.avatar
//       state.usernameCaller = action.payload.username
//     },
//     clearIncomingCall: (state) => {
//       state.status = ""
//       state.targetId = null
//       state.callerId = null
//       state.avatarCaller = null
//       state.usernameCaller = null
//     },
//     acceptCall: (state) => {
//       console.log("inCall")
//       state.status = "inCall"
//     },
//     // endCall: (state) => {
//     //   state.activeCall = null
//     // },
//   },
// })

// export const { setIncomingCall, clearIncomingCall, startCall, acceptCall } =
//   callSlice.actions
// export default callSlice.reducer
