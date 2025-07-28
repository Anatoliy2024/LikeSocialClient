import { createAsyncThunk } from "@reduxjs/toolkit"
import {
  // DialogShortType,
  DialogType,
  MessageType,
} from "../slices/dialogsSlice"
import { dialogsAPI } from "@/api/api"
import axios from "axios"

// ✅ Получить все диалоги
export const getUserDialogsThunk = createAsyncThunk<
  DialogType[],
  void,
  { rejectValue: string }
>("dialogs/getAll", async (_, thunkAPI) => {
  try {
    const data = await dialogsAPI.getUserDialog()
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось загрузить диалоги")
  }
})

// ✅ Получить сообщения по dialogId
export const getUserMessagesThunk = createAsyncThunk<
  {
    messages: MessageType[]
    dialog: DialogType
    totalCount: number
    pages: number
  },
  { dialogId: string; page: number },
  { rejectValue: string }
>("dialogs/getMessages", async ({ dialogId, page }, thunkAPI) => {
  try {
    const data = await dialogsAPI.getUserMessage(dialogId, page)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось загрузить сообщения")
  }
})

// // ✅ Отправить сообщение (с существующим или новым диалогом)
// export const sendUserMessageThunk = createAsyncThunk<
//   MessageType,
//   { recipientUserId: string; text: string; dialogId?: string },
//   { rejectValue: string }
// >(
//   "dialogs/sendMessage",
//   async ({ recipientUserId, text, dialogId }, thunkAPI) => {
//     try {
//       const data = await dialogsAPI.sendUserMessage(
//         recipientUserId,
//         text,
//         dialogId
//       )
//       return data
//     } catch (error) {
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }
//       return thunkAPI.rejectWithValue("Не удалось отправить сообщение")
//     }
//   }
// )

// // ✅ Отправить сообщение (с существующим или новым диалогом)
// export const deleteUserMessageThunk = createAsyncThunk<
//   MessageType,
//   string,
//   { rejectValue: string }
// >(
//   "dialogs/sendMessage",
//   async (messageId, thunkAPI) => {
//     try {
//       const data = await dialogsAPI.deleteUserMessage(
//         messageId
//       )
//       return data
//     } catch (error) {
//       if (axios.isAxiosError(error) && error.response?.data?.message) {
//         return thunkAPI.rejectWithValue(error.response.data.message)
//       }
//       return thunkAPI.rejectWithValue("Не удалось отправить сообщение")
//     }
//   }
// )
