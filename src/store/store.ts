import { configureStore } from "@reduxjs/toolkit"
// import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux"

// Импортируй свои слайсы здесь
// import exampleReducer from "./slices/exampleSlice"
import authReducer from "./slices/authSlice"
import profileReducer from "./slices/profileSlice"
import userPostThunks from "./slices/userPostsSlice"
import roomPostThunks from "./slices/roomPostsSlice"
import usersThunks from "./slices/usersSlice"
import roomsThunks from "./slices/roomsSlice"

export const store = configureStore({
  reducer: {
    // example: exampleReducer,
    auth: authReducer,
    profile: profileReducer,
    userPost: userPostThunks,
    roomPost: roomPostThunks,
    users: usersThunks,
    rooms: roomsThunks,
    // добавь другие редьюсеры здесь
  },
})

// Типы состояния и диспетчера
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// // Хуки для использования в компонентах
// export const useAppDispatch: () => AppDispatch = useDispatch
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
