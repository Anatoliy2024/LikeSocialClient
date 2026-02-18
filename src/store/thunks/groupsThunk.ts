import { createAsyncThunk } from "@reduxjs/toolkit"

import { groupsAPI } from "@/api/api"
import axios from "axios"
import { GroupType, MessageGroupType } from "../slices/groupsSlice"

type TypeCreateGroup = {
  name: string
  selectedMember: string[]
  description: string
}

// ✅ Получить все диалоги
export const createUserGroupsThunk = createAsyncThunk<
  GroupType[],
  TypeCreateGroup,
  { rejectValue: string }
>("groups/create", async ({ name, selectedMember, description }, thunkAPI) => {
  try {
    const data = await groupsAPI.createGroups(name, selectedMember, description)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось создать группу группы")
  }
})
// ✅ Получить все диалоги
export const getUserGroupsThunk = createAsyncThunk<
  GroupType[],
  void,
  { rejectValue: string }
>("groups/getAll", async (_, thunkAPI) => {
  try {
    const data = await groupsAPI.getAllGroups()
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return thunkAPI.rejectWithValue(error.response.data.message)
    }
    return thunkAPI.rejectWithValue("Не удалось загрузить группы")
  }
})
// export const getUserDialogsThunk = createAsyncThunk<
//   DialogType[],
//   void,
//   { rejectValue: string }
// >("dialogs/getAll", async (_, thunkAPI) => {
//   try {
//     const data = await dialogsAPI.getUserDialog()
//     return data
//   } catch (error) {
//     if (axios.isAxiosError(error) && error.response?.data?.message) {
//       return thunkAPI.rejectWithValue(error.response.data.message)
//     }
//     return thunkAPI.rejectWithValue("Не удалось загрузить диалоги")
//   }
// })

// ✅ Получить сообщения по dialogId
export const getUserMessagesThunk = createAsyncThunk<
  {
    messages: MessageGroupType[]
    group: GroupType
    totalCount: number
    pages: number
    // isOnline?: boolean
    // lastSeen?: string | null
  },
  { groupId: string; page: number },
  { rejectValue: string }
>("dialogs/getMessages", async ({ groupId, page }, thunkAPI) => {
  try {
    const data = await groupsAPI.getMessagesGroup(groupId, page)
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
