import { CinemaHallStateType } from "@/types/cinemaHall.types"
import { createSlice } from "@reduxjs/toolkit"

const initialCinemaHallTarget = {
  groupId: null,
  cinemaHallId: null,
  cinemaHallName: null,
  hostId: null,
  participants: [],
  file: { name: null, size: 0, magnet: null },
  isMembersControl: true,
  currentTime: 0,
  playing: false,
  updatedAt: null,
  chat: [],
  playbackUpdatedAt: null, // когда последний раз менялось состояние
  seqNum: 0, // порядковый номер команды
  waitingForUsers: [], // кто сейчас буферизует
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
      // console.log("getAllCinemaHall state", action.payload)
      state.cinemaHalls = action.payload
    },
    getCinemaHallList(state, action) {
      // console.log("getCinemaHall state", action.payload)
      state.cinemaHalls.push(action.payload)
    },
    delCinemaHallList(state, action) {
      // console.log("getCinemaHall state", action.payload)

      state.cinemaHalls = state.cinemaHalls.filter(
        (hall) => hall.cinemaHallId !== action.payload,
      )
    },
    clearCinemaHall(state) {
      state.cinemaHallTarget = {
        ...initialCinemaHallTarget,
        file: { ...initialCinemaHallTarget.file }, // Копируем вложенный объект,
        participants: [],
        chat: [],
        waitingForUsers: [],
      }
    },
    joinUser(state, action) {
      const already = state.cinemaHallTarget.participants.find(
        (p) => p.userId === action.payload.userId,
      )
      if (!already) {
        state.cinemaHallTarget.participants.push(action.payload)
      }

      // state.cinemaHallTarget.participants.push(action.payload)
    },
    leftUser(state, action) {
      state.cinemaHallTarget.participants =
        state.cinemaHallTarget.participants.filter(
          (user) => user.userId !== action.payload,
        )
    },

    addChatMessage(state, action) {
      state.cinemaHallTarget.chat.push(action.payload)
    },
    getAllChatMessage(state, action) {
      state.cinemaHallTarget.chat = action.payload
    },

    applyPlay(state, action) {
      const { currentTime, playbackUpdatedAt, seqNum } = action.payload
      state.cinemaHallTarget.playing = true
      state.cinemaHallTarget.currentTime = currentTime
      state.cinemaHallTarget.playbackUpdatedAt = playbackUpdatedAt
      state.cinemaHallTarget.seqNum = seqNum
      state.cinemaHallTarget.waitingForUsers = []
    },

    // Вызывается когда сервер прислал pause или force-pause
    applyPause(state, action) {
      const { currentTime, playbackUpdatedAt, seqNum, waitingFor } =
        action.payload
      state.cinemaHallTarget.playing = false
      state.cinemaHallTarget.currentTime = currentTime
      state.cinemaHallTarget.playbackUpdatedAt = playbackUpdatedAt
      state.cinemaHallTarget.seqNum = seqNum
      if (waitingFor !== undefined) {
        state.cinemaHallTarget.waitingForUsers = waitingFor
      }
    },

    // Вызывается когда сервер прислал seek
    applySeek(state, action) {
      const { position, playing, playbackUpdatedAt, seqNum } = action.payload
      state.cinemaHallTarget.currentTime = position
      state.cinemaHallTarget.playing = playing
      state.cinemaHallTarget.playbackUpdatedAt = playbackUpdatedAt
      state.cinemaHallTarget.seqNum = seqNum
      state.cinemaHallTarget.waitingForUsers = []
    },

    // Кто-то буферизует / перестал буферизовать
    applyWaitingFor(state, action) {
      state.cinemaHallTarget.waitingForUsers = action.payload
    },

    removeParticipant(state, action) {
      state.cinemaHallTarget.participants =
        state.cinemaHallTarget.participants.filter(
          (p) => p.userId !== action.payload,
        )
    },
    changeMemberControl(state, action) {
      state.cinemaHallTarget.isMembersControl = action.payload
    },
  },
})

export const {
  //work room
  setCinemaHall,
  getAllCinemaHall,
  getCinemaHallList,

  delCinemaHallList,
  clearCinemaHall,
  joinUser,
  leftUser,
  //chat
  addChatMessage,
  getAllChatMessage,
  //player
  applyPlay,
  applyPause,
  applySeek,
  applyWaitingFor,

  removeParticipant,
  changeMemberControl,
} = cinemaHallSlice.actions

export default cinemaHallSlice.reducer
