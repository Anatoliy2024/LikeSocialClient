// store/slices/conversationSlice.ts
import {
  createSlice,
  PayloadAction,
  //  PayloadAction
} from "@reduxjs/toolkit"
// import { api } from '../api' // ваш axios-инстанс
// import { socket } from '../socket' // ваш socket.io-client
import {
  addMemberToGroupThunk,
  changeAvatarGroupThunk,
  createGroupConversationThunk,
  delConversationThunk,
  deleteMemberToGroupThunk,
  delHistoryMessagesThunk,
  // fetchConversationMessagesThunk,
  fetchConversationsThunk,
  fetchItemConversationThunk,
  fetchMessagesThunk,
} from "../thunks/conversationsThunk"
import { ConversationsState, MessageType } from "@/types/conversation.types"

const initialPagination = {
  page: 1,
  pages: 1,
  total: 0,
  hasMore: true,
  hasLoaded: false,
}

const initialState: ConversationsState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  pagination: initialPagination,
}

const conversationSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    // Новое сообщение пришло через сокет
    addMessageFromSocket(state, action: PayloadAction<MessageType>) {
      console.log("addMessageFromSocket****", action.payload)
      state.messages.unshift(action.payload)

      // // Обновляем lastMessage в списке бесед
      // const conv = state.conversations.find(
      //   (c) => c._id === action.payload.conversationId
      // )
      // if (conv) {
      //   conv.lastMessageId = action.payload
      //   conv.updatedAt = action.payload.createdAt
      // }
    },
    reactionUpdateFromSocket(
      state,
      action: PayloadAction<{
        messageId: string
        reactions: MessageType["reactions"]
      }>
    ) {
      const message = state.messages.find(
        (m) => m._id === action.payload.messageId
      )
      if (message) {
        message.reactions = action.payload.reactions
      }
    },

    // Сброс при смене беседы
    clearMessages(state) {
      state.messages = []
      state.currentConversation = null
      state.pagination = {
        page: 1,
        pages: 1,
        total: 0,
        hasMore: true,
        hasLoaded: false,
      }
    },

    incrementPage(state) {
      state.pagination.page += 1
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchConversations
      .addCase(fetchConversationsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchConversationsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.conversations = action.payload?.conversations
      })
      .addCase(fetchConversationsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка получения всех бесед"
      })
      .addCase(fetchItemConversationThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchItemConversationThunk.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.currentConversation = action.payload?.conversation
        }
        state.loading = false
      })
      .addCase(fetchItemConversationThunk.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.error.message || "Ошибка получения выбранной группы"
      })

      // createGroupConversationThunk
      .addCase(createGroupConversationThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createGroupConversationThunk.fulfilled, (state, action) => {
        if (action.payload.success) {
          // state.conversations = [
          //   action.payload.conversation,
          //   ...state.conversations,
          // ]

          state.currentConversation = action.payload.conversation
        }
        // state.currentId = action.payload.conversation._id

        state.loading = false
      })

      .addCase(createGroupConversationThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка создания беседы"
      })

      // delHistoryMessagesThunk
      .addCase(delHistoryMessagesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(delHistoryMessagesThunk.fulfilled, (state, action) => {
        if (action.payload.success) {
          state.messages = []
          state.pagination = initialPagination
        }
        state.loading = false

        //       return res.json({
        //         success: true,
        //         type: "group",
        //       })
        // return res.json({
        //         success: true,
        //         type: "private",
        //       })
        // state.currentId = action.payload.conversation._id
      })
      .addCase(delHistoryMessagesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка удаления беседы"
      })

      // delConversationThunk
      .addCase(delConversationThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(delConversationThunk.fulfilled, (state, action) => {
        // return res.json({
        //   success: true,
        //   conversationId,
        // })
        if (action.payload.success) {
          const id = action.payload.conversationId

          state.conversations = state.conversations.filter((c) => c._id !== id)

          state.messages = []
          state.currentConversation = null
          state.pagination = initialPagination
        }
        state.loading = false
      })
      .addCase(delConversationThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка удаления беседы"
      })

      // fetchMessagesThunk
      .addCase(fetchMessagesThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
        const { messages, conversation, totalCount, pages } = action.payload
        const { page } = state.pagination

        if (page === 1 && !state.pagination.hasLoaded) {
          state.messages = messages
          state.currentConversation = conversation
          state.pagination.hasLoaded = true
        } else {
          // // Докладываем старые сообщения в конец (они старше)
          // state.messages = [...state.messages, ...messages]

          // Следующие страницы: докладываем старые сообщения в конец.
          // Фильтруем дубли на случай повторного запроса.
          const existingIds = new Set(state.messages.map((m) => m._id))
          const unique = messages.filter((m) => !existingIds.has(m._id))
          state.messages = [...state.messages, ...unique]
        }

        state.pagination.total = totalCount
        state.pagination.pages = pages
        state.pagination.hasMore = page < pages
        state.loading = false
      })
      .addCase(fetchMessagesThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка загрузки сообщений"
      })
      .addCase(addMemberToGroupThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addMemberToGroupThunk.fulfilled, (state, action) => {
        if (action.payload.success && state.currentConversation) {
          state.currentConversation.members = [
            ...action.payload.members,
            ...state.currentConversation.members,
          ]
        }
        state.loading = false
      })
      .addCase(addMemberToGroupThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка добавления участников"
      })
      .addCase(deleteMemberToGroupThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteMemberToGroupThunk.fulfilled, (state, action) => {
        if (action.payload.success && state.currentConversation) {
          state.currentConversation.members =
            state.currentConversation.members.filter(
              (member) => member.user._id !== action.payload.memberId
            )
        }
        state.loading = false
      })
      .addCase(deleteMemberToGroupThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка удаления участника"
      })

      .addCase(changeAvatarGroupThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(changeAvatarGroupThunk.fulfilled, (state, action) => {
        state.loading = false

        if (action.payload.success && state.currentConversation) {
          state.currentConversation.avatar = action.payload.avatar
          state.currentConversation.avatarPublicId =
            action.payload.avatarPublicId
        }
      })
      .addCase(changeAvatarGroupThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Ошибка при смене аватарки группы"
      })
  },
})

export const {
  addMessageFromSocket,
  reactionUpdateFromSocket,
  clearMessages,
  incrementPage,
  // setCurrentConversation,
  // addMessageToCurrent,
  // conversationUpdated,
  // clearConversations,
} = conversationSlice.actions

export default conversationSlice.reducer
