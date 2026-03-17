import { createAsyncThunk } from "@reduxjs/toolkit"

// import { groupsAPI } from "@/api/api"
import axios from "axios"
import { GroupType, MessageGroupType } from "../slices/groupsSlice"
import { groupsAPI } from "@/api/groupsAPI"

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
