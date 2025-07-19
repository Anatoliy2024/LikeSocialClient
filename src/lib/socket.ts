// src/lib/socket.ts
import { baseApiUrl } from "@/api/instance"
import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export const getSocket = () => {
  if (!socket) {
    console.log("url socket", baseApiUrl)
    socket = io(baseApiUrl, {
      withCredentials: true,
      // autoConnect: false,
      // transports: ["websocket", "polling"],

      reconnection: true,
      reconnectionAttempts: 50,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    })
  }
  return socket
}
