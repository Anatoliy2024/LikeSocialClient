import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export type GroupCallStatus = "idle" | "inCall"

interface Participant {
  userId: string
  socketId: string
  audioEnabled: boolean
  videoEnabled: boolean
}

interface GroupCallState {
  status: GroupCallStatus
  groupId: string | null
  participants: Participant[]
  isAudioEnabled: boolean
  // isVideoEnabled: boolean

  activeGroupCalls: Record<string, number> // groupId -> participantsCount
}

const initialState: GroupCallState = {
  status: "idle",
  groupId: null,
  participants: [],
  isAudioEnabled: true,
  // isVideoEnabled: false,
  activeGroupCalls: {},
}

const groupCallSlice = createSlice({
  name: "groupCall",
  initialState,
  reducers: {
    joinGroupCall: (state, action: PayloadAction<{ groupId: string }>) => {
      state.status = "inCall"
      state.groupId = action.payload.groupId
      // console.log("joinGroupCall", state)
    },
    leaveGroupCall: (state) => {
      state.status = "idle"
      state.groupId = null
      state.participants = []
      state.isAudioEnabled = true
      // console.log("leaveGroupCall", state)

      // state.isVideoEnabled = false
    },
    addParticipant: (state, action: PayloadAction<Participant>) => {
      const exists = state.participants.find(
        (p) => p.socketId === action.payload.socketId
      )
      if (!exists) {
        state.participants.push(action.payload)
      }
    },
    removeParticipant: (state, action: PayloadAction<{ socketId: string }>) => {
      state.participants = state.participants.filter(
        (p) => p.socketId !== action.payload.socketId
      )
    },
    toggleAudio: (state) => {
      state.isAudioEnabled = !state.isAudioEnabled
    },
    // toggleVideo: (state) => {
    //   state.isVideoEnabled = !state.isVideoEnabled
    // },
    // Добавь новые редюсеры:
    setGroupCallActive: (
      state,
      action: PayloadAction<{ groupId: string; participantsCount: number }>
    ) => {
      state.activeGroupCalls[action.payload.groupId] =
        action.payload.participantsCount
      // console.log(
      //   "state.activeGroupCalls",
      //   state.activeGroupCalls[action.payload.groupId]
      // )
    },
    setGroupCallEnded: (state, action: PayloadAction<{ groupId: string }>) => {
      delete state.activeGroupCalls[action.payload.groupId]
    },
    updateGroupCallCount: (
      state,
      action: PayloadAction<{ groupId: string; participantsCount: number }>
    ) => {
      const { groupId, participantsCount } = action.payload
      // console.log("participantsCount", participantsCount)
      // console.log("groupId", groupId)
      // console.log("state.activeGroupCalls", state.activeGroupCalls)
      // if (state.activeGroupCalls[groupId] !== participantsCount) {
      state.activeGroupCalls[groupId] = participantsCount

      // console.log(
      //   "state.activeGroupCalls",
      //   state.activeGroupCalls[action.payload.groupId]
      // )

      // }

      // if (state.activeGroupCalls[action.payload.groupId] !== undefined) {
      //   state.activeGroupCalls[action.payload.groupId] =
      //     action.payload.participantsCount
      // }
    },
  },
})

export const {
  joinGroupCall,
  leaveGroupCall,
  addParticipant,
  removeParticipant,
  toggleAudio,
  // toggleVideo,
  setGroupCallActive,
  setGroupCallEnded,
  updateGroupCallCount,
} = groupCallSlice.actions

export default groupCallSlice.reducer
