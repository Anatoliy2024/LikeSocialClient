import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import {
  getUserDialogsThunk,
  getUserMessagesThunk,
} from "../thunks/dialogsThunk"

export interface MessageType {
  _id: string
  senderId: {
    _id: string
    username: string
    avatar: string
  }
  text: string
  dialogId?: string
  createdAt: string
}

export interface DialogType {
  _id: string
  members: {
    _id: string
    username: string
    avatar: string
  }[]
  lastMessageId?: MessageType
}

interface DialogsState {
  dialogs: DialogType[]
  messages: MessageType[]
  currentDialogId: string | null
  loading: boolean
  error: string | null
}

const initialState: DialogsState = {
  dialogs: [],
  messages: [],
  currentDialogId: null,
  loading: false,
  error: null,
}

const dialogsSlice = createSlice({
  name: "dialogs",
  initialState,
  reducers: {
    // setCurrentDialog(state, action: PayloadAction<string>) {
    //   state.currentDialogId = action.payload
    // },
    addMessageFromSocket(state, action: PayloadAction<MessageType>) {
      // if (state.currentDialogId === action.payload.dialogId) {
      state.messages.unshift(action.payload)
      // }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getUserDialogsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getUserDialogsThunk.fulfilled, (state, action) => {
        state.dialogs = action.payload
        state.loading = false
      })
      .addCase(getUserDialogsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка загрузки диалогов"
      })

      .addCase(getUserMessagesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getUserMessagesThunk.fulfilled, (state, action) => {
        state.messages = action.payload.messages
        state.currentDialogId = action.payload.dialogId
        state.loading = false
      })
      .addCase(getUserMessagesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка загрузки сообщений"
      })
  },
})

export const { addMessageFromSocket } = dialogsSlice.actions
export default dialogsSlice.reducer
