import { createSlice } from "@reduxjs/toolkit"

export type CallStatus = "calling" | "incoming" | "inCall" | ""
interface CallState {
  status: CallStatus
  callerId: string | null
  targetId: string | null
}

const initialState: CallState = {
  status: "",
  callerId: null, // кто звонит,,
  targetId: null, // кому звоним
}

const callSlice = createSlice({
  name: "call",
  initialState,
  reducers: {
    startCall: (state, action) => {
      state.status = "calling"
      state.targetId = action.payload.peerId
    },
    setIncomingCall: (state, action) => {
      state.status = "incoming"
      state.callerId = action.payload.callerId
    },
    clearIncomingCall: (state) => {
      state.status = ""
      state.targetId = null
      state.callerId = null
    },
    acceptCall: (state) => {
      console.log("inCall")
      state.status = "inCall"
    },
    // endCall: (state) => {
    //   state.activeCall = null
    // },
  },
})

export const { setIncomingCall, clearIncomingCall, startCall, acceptCall } =
  callSlice.actions
export default callSlice.reducer
