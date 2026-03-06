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
  // getMessagesReadThunk,
  getMessageViewersThunk,
} from "../thunks/conversationsThunk"
import { ConversationsState, MessageType } from "@/types/conversation.types"

const initialPagination = {
  hasMoreOlder: false, // есть ли старые сверху
  // hasMoreNewer: false, // есть ли новые снизу
  hasLoaded: false,
  page: 0,
  pages: 0,
}

const initialState: ConversationsState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  messageViewers: {
    users: [],
    isLoading: false,
  },
  loading: false,
  error: null,
  pagination: { ...initialPagination },
  lastReadMessageId: null, // для разделителя
  lastReadMessageDate: null as string | null,
  unreadCount: 0, // для зелёного кружка
  // pendingNewMessages: 0, // для кнопки "↓ 3 новых"
  oldestMessageId: null, // cursor для подгрузки старых
  // newestMessageId: null, // cursor для подгрузки новых
}

const conversationSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    addMessageFromSocket(state, action: PayloadAction<MessageType>) {
      state.messages.push(action.payload)
      // state.pendingNewMessages += 1
      // state.newestMessageId = action.payload._id
    },

    // clearPendingNewMessages(state) {
    //   state.pendingNewMessages = 0
    // },

    reactionUpdateFromSocket(state, action) {
      const message = state.messages.find(
        (m) => m._id === action.payload.messageId
      )
      if (message) message.reactions = action.payload.reactions
    },

    readUpdateFromSocket(
      state,
      action: PayloadAction<{ userId: string; lastReadMessageId: string }>
    ) {
      state.messages.forEach((msg) => {
        if (
          msg._id.toString() <= action.payload.lastReadMessageId.toString() &&
          msg.senderId._id !== action.payload.userId
        ) {
          msg.readCount = (msg.readCount || 0) + 1
        }
      })
    },
    messageDeleteFromSocket(
      state,
      action: PayloadAction<{ messageId: string }>
    ) {
      state.messages = state.messages.filter(
        (message) => message._id !== action.payload.messageId
      )
    },
    messageEditedFromSocket(
      state,
      action: PayloadAction<{
        messageId: string
        text: string
        isEdited: boolean
        editedAt: string
      }>
    ) {
      state.messages = state.messages.map((message) => {
        if (message._id === action.payload.messageId) {
          return {
            ...message,
            text: action.payload.text,
            isEdited: action.payload.isEdited,
            editedAt: action.payload.editedAt,
          }
        }
        return message
      })
    },

    clearMessages(state) {
      state.messages = []
      state.currentConversation = null
      state.pagination = { ...initialPagination }
      state.oldestMessageId = null
      // state.newestMessageId = null
      state.lastReadMessageId = null
      state.unreadCount = 0
      // state.pendingNewMessages = 0
    },
    clearMessageViewers(state) {
      state.messageViewers = {
        users: [],
        isLoading: false,
      }
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
      // fetchMessagesThunk.fulfilled
      .addCase(fetchMessagesThunk.fulfilled, (state, action) => {
        const {
          messages,
          conversation,
          hasMoreOlder,
          // hasMoreNewer,
          lastReadMessageId,
          unreadCount,
          direction,
        } = action.payload
        console.log("action.payload", action.payload)

        state.lastReadMessageDate = action.payload.lastReadMessageDate ?? null
        if (!direction || direction === "initial") {
          // Первая загрузка
          state.messages = messages
          state.currentConversation = conversation
          state.pagination.hasLoaded = true
          state.lastReadMessageId = lastReadMessageId ?? null
          state.unreadCount = unreadCount ?? 0
          state.oldestMessageId = messages[0]?._id ?? null
          // state.newestMessageId = messages[messages.length - 1]?._id ?? null
        } else if (direction === "older") {
          // Старые — кладём В НАЧАЛО
          const existingIds = new Set(state.messages.map((m) => m._id))
          const unique = messages.filter((m) => !existingIds.has(m._id))
          state.messages = [...unique, ...state.messages]
          state.oldestMessageId = unique[0]?._id ?? state.oldestMessageId
        }
        // else if (direction === "newer") {
        //   // Новые — кладём В КОНЕЦ
        //   const existingIds = new Set(state.messages.map((m) => m._id))
        //   const unique = messages.filter((m) => !existingIds.has(m._id))
        //   state.messages = [...state.messages, ...unique]
        //   state.newestMessageId =
        //     unique[unique.length - 1]?._id ?? state.newestMessageId
        // }
        state.lastReadMessageDate = action.payload.lastReadMessageDate ?? null
        state.pagination.hasMoreOlder = hasMoreOlder
        // state.pagination.hasMoreNewer = hasMoreNewer
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
      .addCase(getMessageViewersThunk.pending, (state) => {
        state.messageViewers.isLoading = true
        state.error = null
      })
      .addCase(getMessageViewersThunk.fulfilled, (state, action) => {
        state.messageViewers.isLoading = false

        state.messageViewers.users = action.payload.users
        // state.messageViewers.messageId = action.payload.messageId

        // if (action.payload.success && state.currentConversation) {
        //   state.currentConversation.avatar = action.payload.avatar
        //   state.currentConversation.avatarPublicId =
        //     action.payload.avatarPublicId
        // }
      })
      .addCase(getMessageViewersThunk.rejected, (state, action) => {
        state.messageViewers.isLoading = false
        state.error =
          action.error.message ||
          "Ошибка при получении списка прочитавших юзеров"
      })
  },
})

export const {
  addMessageFromSocket,
  reactionUpdateFromSocket,
  clearMessages,
  messageDeleteFromSocket,
  readUpdateFromSocket,
  messageEditedFromSocket,
  // clearPendingNewMessages,
  clearMessageViewers,
} = conversationSlice.actions

export default conversationSlice.reducer
