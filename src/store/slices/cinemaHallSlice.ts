import { CinemaHallStateType } from "@/types/cinemaHall.types"
import { createSlice } from "@reduxjs/toolkit"

const initialCinemaHallTarget = {
  groupId: null,
  cinemaHallId: null,
  cinemaHallName: null,
  hostId: null,
  participants: [],
  file: { name: null, size: 0, magnet: null },
  currentTime: 0,
  playing: false,
  updatedAt: null,
  chat: [],
}

const initialState: CinemaHallStateType = {
  cinemaHalls: [],
  cinemaHallTarget: { ...initialCinemaHallTarget },
}

const cinemaHallSlice = createSlice({
  name: "cinemaHall",
  initialState,
  reducers: {
    setCinemaHall(state, action) {
      console.log("action", action)
      state.cinemaHallTarget = {
        ...state.cinemaHallTarget,
        ...action.payload,
      }
      //   state.cinemaHallTarget.
    },
    getAllCinemaHall(state, action) {
      console.log("getAllCinemaHall state", action.payload)
      state.cinemaHalls = action.payload
    },
    setPlaying(state, action) {
      state.cinemaHallTarget.playing = action.payload
    },
    setCurrentTime(state, action) {
      state.cinemaHallTarget.currentTime = action.payload
    },
    clearCinemaHall(state) {
      state.cinemaHallTarget = {
        ...initialCinemaHallTarget,
        file: { ...initialCinemaHallTarget.file }, // Копируем вложенный объект
      }
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

export const { setCinemaHall, getAllCinemaHall, clearCinemaHall } =
  cinemaHallSlice.actions

export default cinemaHallSlice.reducer
