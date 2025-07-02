import { configureStore } from "@reduxjs/toolkit"
// import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux"

// Импортируй свои слайсы здесь
// import exampleReducer from "./slices/exampleSlice"
import authReducer from "./slices/authSlice"
import profileReducer from "./slices/profileSlice"
import userPost from "./slices/userPostsSlice"
import roomPost from "./slices/roomPostsSlice"
import users from "./slices/usersSlice"
import rooms from "./slices/roomsSlice"
import server from "./slices/serverSlice"
import userMovies from "./slices/userMoviesSlice"

export const store = configureStore({
  reducer: {
    // example: exampleReducer,
    auth: authReducer,
    profile: profileReducer,
    userPost: userPost,
    roomPost: roomPost,
    users: users,
    rooms: rooms,
    server: server,
    userMovies: userMovies,
    // добавь другие редьюсеры здесь
  },
})

// Типы состояния и диспетчера
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// // Хуки для использования в компонентах
// export const useAppDispatch: () => AppDispatch = useDispatch
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
