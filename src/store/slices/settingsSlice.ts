// store/slices/settingsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface SettingsState {
  soundEnabled: boolean
  notificationsEnabled: boolean // на будущее
}

// Загружаем сохранённое значение при инициализации
const getInitialSoundState = (): boolean => {
  if (typeof window === "undefined") return true
  const saved = localStorage.getItem("soundEnabled")
  return saved !== null ? JSON.parse(saved) : true
}

const initialState: SettingsState = {
  soundEnabled: getInitialSoundState(),
  notificationsEnabled: true,
}

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled
      // Сохраняем в localStorage при каждом изменении
      if (typeof window !== "undefined") {
        localStorage.setItem("soundEnabled", JSON.stringify(state.soundEnabled))
      }
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload
      if (typeof window !== "undefined") {
        localStorage.setItem("soundEnabled", JSON.stringify(state.soundEnabled))
      }
    },
  },
})

export const { toggleSound, setSoundEnabled } = settingsSlice.actions
export default settingsSlice.reducer
