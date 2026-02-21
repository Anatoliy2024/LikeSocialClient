// import { createSlice } from "@reduxjs/toolkit"

// import { fetchMessagesThunk } from "../thunks/messagesThunk"

// // Types
// export interface ConversationMember {
//   user: { _id: string; username: string; avatar?: string; isOnline?: boolean }
//   role: "member" | "admin"
//   joinedAt: string
// }

// export interface Conversation {
//   _id: string
//   type: "private" | "group"
//   title?: string
//   description?: string
//   avatar?: string
//   owner?: string
//   members: ConversationMember[]
//   lastMessageId?: any
//   lastActivityAt: string
//   createdAt: string
//   updatedAt: string
// }

// // interface ConversationState {
// //   conversations: Conversation[]
// //   // currentId: string | null
// //   messages: any[] // типизируйте под ваш Message
// //   loading: boolean
// //   error: string | null
// //   pagination: { page: number; pages: number; total: number }
// // }

// const initialState = {
//   conversations: [],
//   // currentId: null,
//   messages: [],
//   loading: false,
//   error: null,
//   pagination: { page: 1, pages: 1, total: 0 },
// }

// const conversationSlice = createSlice({
//   name: "conversations",
//   initialState,
//   reducers: {
//     clearConversations: (state) => {
//       // state.conversations = []
//       // state.currentId = null
//       state.messages = []

//     },
//   },
//   extraReducers: (builder) => {
//     builder

//       .addCase(fetchMessagesThunk.pending, (state) => {
//         state.loading = true
//         state.error = null
//       })
//       .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
//         state.messages = action.payload.messages
//         state.loading = false
//       })
//       .addCase(fetchMessagesThunk.rejected, (state, action) => {
//         state.loading = false
//         state.error = action.error.message || "Ошибка загрузки сообщений"
//       })
//   },
// })

// export const { clearConversations } = conversationSlice.actions

// export default conversationSlice.reducer
