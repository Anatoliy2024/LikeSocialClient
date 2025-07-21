import { createSlice, PayloadAction } from "@reduxjs/toolkit"

type OnlineStatus = {
  isOnline: boolean
  lastSeen: string | null // null, если сейчас онлайн
}

type OnlineStatusState = {
  [userId: string]: OnlineStatus
}

const initialState: OnlineStatusState = {}

const onlineStatusSlice = createSlice({
  name: "onlineStatus",
  initialState,
  reducers: {
    // Установить весь список (например, после подключения)
    setOnlineStatusList(state, action: PayloadAction<OnlineStatusState>) {
      return action.payload
    },
    // Обновить одного пользователя
    updateUserStatus(
      state,
      action: PayloadAction<{ userId: string; status: OnlineStatus }>
    ) {
      state[action.payload.userId] = action.payload.status
    },
    // Удалить пользователя (например, при выходе)
    removeUserStatus(state, action: PayloadAction<string>) {
      delete state[action.payload]
    },
    // Очистить весь список
    clearOnlineStatus() {
      return {}
    },
  },
})

export const {
  setOnlineStatusList,
  updateUserStatus,
  removeUserStatus,
  clearOnlineStatus,
} = onlineStatusSlice.actions

export default onlineStatusSlice.reducer
