// store/thunks/conversationThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { conversationAPI } from "@/api/conversationAPI"
import {
  ConversationType,
  MemberFullType,
  MessageType,
  messageViewersUserType,
} from "@/types/conversation.types"
import { fileAPI } from "@/api/api"

// ===== Создание группы =====
export const createGroupConversationThunk = createAsyncThunk<
  { success: boolean; conversation: ConversationType },
  // ConversationType,
  { title: string; memberIds: string[]; description?: string; avatar?: string },
  { rejectValue: string }
>(
  "conversations/createGroup",
  async ({ title, memberIds, description, avatar }, thunkAPI) => {
    try {
      const data = await conversationAPI.createGroup(
        title,
        memberIds,
        avatar,
        description
      )
      return data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }
      return thunkAPI.rejectWithValue("Не удалось создать группу")
    }
  }
)

// ===== Получение всех конверсейшенов =====
export const fetchConversationsThunk = createAsyncThunk<
  { message: string; conversations: ConversationType[] },
  // ConversationType[],
  { page: number; limit?: number },
  { rejectValue: string }
>("conversations/fetchAll", async ({ page, limit }, thunkAPI) => {
  try {
    const data = await conversationAPI.getAll(page, limit)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось загрузить список чатов")
  }
})
// ===== Получение всех конверсейшенов =====
export const fetchItemConversationThunk = createAsyncThunk<
  { success: boolean; conversation: ConversationType },
  // ConversationType[],
  string,
  { rejectValue: string }
>("conversations/fetchItemConversation", async (conversationId, thunkAPI) => {
  try {
    const data = await conversationAPI.getCurrentConversation(conversationId)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось загрузить выбранную беседу")
  }
})

export const fetchMessagesThunk = createAsyncThunk<
  {
    messages: MessageType[]
    conversation: ConversationType
    hasMoreOlder: boolean
    hasMoreNewer: boolean
    lastReadMessageId?: string | null
    lastReadMessageDate: string | null
    unreadCount?: number
    isOnline?: boolean
    lastSeen?: Date
    direction?: "initial" | "older" | "newer"
  },
  {
    conversationId: string
    direction?: "initial" | "older" | "newer"
    cursor?: string
    limit?: number
  },
  { rejectValue: string }
>(
  "conversations/fetchMessages",
  async (
    { conversationId, direction = "initial", cursor, limit },
    thunkAPI
  ) => {
    try {
      const data = await conversationAPI.getMessages(
        conversationId,
        direction,
        cursor,
        limit
      )
      return { ...data, direction }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }
      return thunkAPI.rejectWithValue("Не удалось загрузить сообщения")
    }
  }
)
// // ===== Получение сообщений чата =====
// export const fetchMessagesThunk = createAsyncThunk<
//   {
//     messages: MessageType[]
//     conversation: ConversationType
//     totalCount: number
//     pages: number
//     currentPage: number
//     lastReadMessageId: string | null
//     unreadCount: number
//     isOnline?: boolean
//     lastSeen?: Date
//   },
//   // MessagesResponse,
//   { conversationId: string; page: number; limit?: number },
//   { rejectValue: string }
// >(
//   "conversations/fetchMessages",
//   async ({ conversationId, page, limit }, thunkAPI) => {
//     try {
//       const data = await conversationAPI.getMessages(
//         conversationId,
//         page,
//         limit
//       )
//       console.log("data*****************", data)
//       return data
//     } catch (error) {
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }
//       return thunkAPI.rejectWithValue("Не удалось загрузить сообщения")
//     }
//   }
// )
// ===== удаление беседы =====
export const delConversationThunk = createAsyncThunk<
  { success: boolean; conversationId: string },
  // MessagesResponse,
  string,
  { rejectValue: string }
>("conversations/delConversation", async (conversationId, thunkAPI) => {
  try {
    const data = await conversationAPI.delConversation(conversationId)
    // console.log("data*****************", data)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось удалить беседу")
  }
})
// ===== удаление беседы =====
export const delHistoryMessagesThunk = createAsyncThunk<
  { success: boolean; type: "private" | "group" },
  string,
  { rejectValue: string }
>("conversations/delHistoryMessages", async (conversationId, thunkAPI) => {
  try {
    const data = await conversationAPI.delHistoryMessages(conversationId)

    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось удалить историю")
  }
})

export const addMemberToGroupThunk = createAsyncThunk<
  { success: boolean; members: MemberFullType[] },
  { conversationId: string; members: string[] },
  { rejectValue: string }
>(
  "conversations/addMemberToGroup",
  async ({ conversationId, members }, thunkAPI) => {
    try {
      const data = await conversationAPI.addMemberToGroup(
        conversationId,
        members
      )

      return data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }
      return thunkAPI.rejectWithValue("Не удалось добавить участников")
    }
  }
)

export const deleteMemberToGroupThunk = createAsyncThunk<
  { success: boolean; memberId: string },
  { conversationId: string; memberId: string },
  { rejectValue: string }
>(
  "conversations/deleteMemberToGroup",
  async ({ conversationId, memberId }, thunkAPI) => {
    try {
      const data = await conversationAPI.deleteMemberToGroup(
        conversationId,
        memberId
      )

      return data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }
      return thunkAPI.rejectWithValue("Не удалось удалить участника")
    }
  }
)

export const getMessageViewersThunk = createAsyncThunk<
  { users: messageViewersUserType[] },
  // { success: true },
  string,
  { rejectValue: string }
>("conversations/getMessageViewers", async (messageId, thunkAPI) => {
  try {
    const data = await conversationAPI.getMessageViewers(messageId)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось получить прочитавших сообщение")
  }
})
// // ===== Опционально: маркер прочитанных =====
// export const markConversationAsReadThunk = createAsyncThunk<
//   unknown,
//   // { success: true },
//   { conversationId: string; messageId: string },
//   { rejectValue: string }
// >("conversations/markRead", async ({ conversationId, messageId }, thunkAPI) => {
//   try {
//     const data = await conversationAPI.markAsRead(conversationId, messageId)
//     return data
//   } catch (error) {
//     if (axios.isAxiosError(error) && error.response?.data?.message) {
//       return thunkAPI.rejectWithValue(error.response.data.message)
//     }
//     return thunkAPI.rejectWithValue("Не удалось отметить как прочитанное")
//   }
// })

export const changeAvatarGroupThunk = createAsyncThunk<
  { success: boolean; avatar: string; avatarPublicId: string }, // тип данных, которые вернутся — массив пользователей
  { file: File; groupId: string }, // параметр тип данных которые отправляю
  { rejectValue: string }
>("conversations/changeAvatarGroup", async ({ file, groupId }, thunkAPI) => {
  try {
    const data = await fileAPI.uploadGroupAvatar(file, groupId)
    return data
  } catch (error: unknown) {
    // Проверка, является ли ошибка ошибкой Axios
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }

    // если это вообще не ошибка axios или нет message
    return thunkAPI.rejectWithValue("Ошибка при изменении аватара группы")
  }
})
