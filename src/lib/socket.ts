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

export const destroySocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
