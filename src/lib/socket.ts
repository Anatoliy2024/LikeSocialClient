// src/lib/socket.ts
import { baseApiUrl } from "@/api/instance"
import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export const getSocket = (newToken?: string): Socket => {
  if (!socket) {
    socket = io(baseApiUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 50,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      auth: {
        token: newToken,
      },
    })
  } else if (newToken) {
    ;(socket.auth as { token?: string }).token = newToken
  }

  return socket
}

// export const getSocket = (token: string) => {
//   if (!socket) {
//     socket = io(baseApiUrl, {
//       withCredentials: true,
//       reconnection: true,
//       reconnectionAttempts: 50,
//       reconnectionDelay: 5000,
//       reconnectionDelayMax: 10000,
//       timeout: 10000,
//       auth: {
//         token, // прокидываем актуальный токен
//       },
//     })
//   }
//   return socket
// }

// export const getSocket = () => {
//   if (!socket) {
//     //
//     socket = io(baseApiUrl, {
//       withCredentials: true,
//       // autoConnect: false,
//       // transports: ["websocket", "polling"],

//       reconnection: true,
//       reconnectionAttempts: 50,
//       reconnectionDelay: 5000,
//       reconnectionDelayMax: 10000,
//       timeout: 10000,
//       auth: {
//         token: localStorage.getItem("accessToken"), // или откуда ты хранишь JWT
//       },
//     })
//   }
//   return socket
// }
