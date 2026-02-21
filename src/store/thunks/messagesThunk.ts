// // store/thunks/conversationThunks.ts
// import { createAsyncThunk } from "@reduxjs/toolkit"
// import axios from "axios"
// import { conversationAPI } from "@/api/conversationAPI"

// // ===== Получение сообщений чата =====
// export const fetchMessagesThunk = createAsyncThunk<
//   unknown,
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
//       return data
//     } catch (error) {
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }
//       return thunkAPI.rejectWithValue("Не удалось загрузить сообщения")
//     }
//   }
// )

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
