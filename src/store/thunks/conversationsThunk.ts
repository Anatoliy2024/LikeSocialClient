// store/thunks/conversationThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"
import { conversationAPI } from "@/api/conversationAPI"
import {
  ConversationType,
  MemberFullType,
  MessageType,
} from "@/types/conversation.types"

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

// ===== Получение сообщений чата =====
export const fetchMessagesThunk = createAsyncThunk<
  {
    messages: MessageType[]
    conversation: ConversationType
    totalCount: number
    pages: number
    currentPage: number
    isOnline?: boolean
    lastSeen?: Date
  },
  // MessagesResponse,
  { conversationId: string; page: number; limit?: number },
  { rejectValue: string }
>(
  "conversations/fetchMessages",
  async ({ conversationId, page, limit }, thunkAPI) => {
    try {
      const data = await conversationAPI.getMessages(
        conversationId,
        page,
        limit
      )
      console.log("data*****************", data)
      return data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        return thunkAPI.rejectWithValue(error.response.data.message)
      }
      return thunkAPI.rejectWithValue("Не удалось загрузить сообщения")
    }
  }
)
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
// ===== удаление беседы =====
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

// ===== Опционально: маркер прочитанных =====
export const markConversationAsReadThunk = createAsyncThunk<
  unknown,
  // { success: true },
  { conversationId: string; messageId: string },
  { rejectValue: string }
>("conversations/markRead", async ({ conversationId, messageId }, thunkAPI) => {
  try {
    const data = await conversationAPI.markAsRead(conversationId, messageId)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось отметить как прочитанное")
  }
})
