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
export interface DialogShortType {
  _id: string
  members: string[]
  lastMessageId?: MessageType
}

interface DialogsState {
  dialogs: DialogType[]
  messages: MessageType[]
  currentDialog: DialogShortType | null
  loading: boolean
  error: string | null
  totalCount: number
  currentPage: number

  hasMore: boolean
}

const initialState: DialogsState = {
  dialogs: [],
  messages: [],
  currentDialog: null,
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,

  hasMore: true,
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
      // console.log("action.payload", action.payload)
      state.messages.unshift(action.payload)
      // }
    },
    clearMessages: (state) => {
      state.messages = []
      state.currentPage = 1
      state.hasMore = true
      state.currentDialog = null
    },
    changeCurrantPage: (state) => {
      state.currentPage += 1
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
        // state.messages = action.payload.messages
        // console.log("state.messages", state.messages)
        // state.messages = [...state.messages, ...action.payload.messages]
        // state.currentDialog = action.payload.dialog
        // state.loading = false
        const newMessages = action.payload.messages

        if (state.currentPage === 1) {
          state.messages = newMessages
        } else {
          state.messages = [...state.messages, ...newMessages]
        }
        state.totalCount = action.payload.totalCount
        state.loading = false
        // state.currentPage +=  1
        state.hasMore = state.currentPage < action.payload.pages
        if (!state.currentDialog) state.currentDialog = action.payload.dialog
      })
      .addCase(getUserMessagesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка загрузки сообщений"
      })
  },
})

export const { addMessageFromSocket, clearMessages, changeCurrantPage } =
  dialogsSlice.actions
export default dialogsSlice.reducer
