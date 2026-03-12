// src/lib/socket.ts
import { io, Socket } from "socket.io-client"
import { baseApiUrl } from "@/api/instance"

let socket: Socket | null = null

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    socket = io(baseApiUrl, {
      autoConnect: false,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 50,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
      auth: {
        token,
      },
    })
  } else if (token) {
    socket.auth = { token }
  }

  return socket
}

export const destroySocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// // src/lib/socket.ts
// import { baseApiUrl } from "@/api/instance"
// import { io, Socket } from "socket.io-client"

// let socket: Socket | null = null

// export const getSocket = (newToken?: string): Socket => {
//   if (!socket) {
//     socket = io(baseApiUrl, {
//       withCredentials: true,
//       reconnection: true,
//       reconnectionAttempts: 50,
//       reconnectionDelay: 5000,
//       reconnectionDelayMax: 10000,
//       timeout: 10000,
//       auth: {
//         token: newToken,
//       },
//     })
//   } else if (newToken) {
//     ;(socket.auth as { token?: string }).token = newToken
//   }

//   return socket
// }

// export const destroySocket = (): void => {
//   if (socket) {
//     console.log("Сокет был найден")
//     socket.disconnect()
//     socket = null
//   }
//   console.log("После удаления")
// }
