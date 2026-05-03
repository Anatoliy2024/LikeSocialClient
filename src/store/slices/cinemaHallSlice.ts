import { CinemaHallStateType } from "@/types/cinemaHall.types"
import { createSlice } from "@reduxjs/toolkit"

const initialState: CinemaHallStateType = {
  cinemaHalls: [],
  cinemaHallTarget: {
    cinemaHallId: null,
    cinemaHallName: null,
    hostId: null,
    participants: [],
    file: { name: null, size: 0 },
    currentTime: 0,
    playing: false,
    updatedAt: null,
    chat: [],
  },
}

const cinemaHallSlice = createSlice({
  name: "cinemaHall",
  initialState,
  reducers: {
    setCinemaHall(state, action) {
      //   console.log("action", action)
      state.cinemaHallTarget = action.payload
      //   state.cinemaHallTarget.
    },
    setPlaying(state, action) {
      state.cinemaHallTarget.playing = action.payload
    },
    setCurrentTime(state, action) {
      state.cinemaHallTarget.currentTime = action.payload
    },
    // participantFileReady(state, action) {
    //   const p = state.cinemaHallTarget.participants.find(
    //     (p) => p.userId === action.payload,
    //   )
    //   if (p) p.fileReady = true
    // },
    // addChatMessage(state, action) {
    //   state.cinemaHallTarget.chat.push(action.payload)
    // },
  },
})

export const { setCinemaHall } = cinemaHallSlice.actions

export default cinemaHallSlice.reducer
