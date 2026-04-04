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
import notifications from "./slices/notificationsSlice"
import onlineStatus from "./slices/onlineStatusSlice"
import callReducer from "./slices/callSlice"
import conversationsReducer from "./slices/conversationsSlice"
import groupCallReducer from "./slices/groupCallSlice"
import adminReducer from "./slices/adminSlice"
import settingsReducer from "./slices/settingsSlice"
import pushNotificationsReducer from "./slices/pushNotificationsSlice"
import zombicideReducer from "./slices/zombicideSlice"
// import pushDevicesReducer from "./slices/pushDevicesSlice"
// import messagesReducer from "./slices/messagesSlice"

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
    notifications: notifications,
    onlineStatus: onlineStatus,

    call: callReducer,
    groupCall: groupCallReducer,
    conversations: conversationsReducer,
    admin: adminReducer,
    settings: settingsReducer,
    pushNotifications: pushNotificationsReducer,
    zombicideSlice: zombicideReducer,
    // pushDevices: pushDevicesReducer,
    // messages: messagesReducer,
    // добавь другие редьюсеры здесь
  },
})

// Типы состояния и диспетчера
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// // Хуки для использования в компонентах
// export const useAppDispatch: () => AppDispatch = useDispatch
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
