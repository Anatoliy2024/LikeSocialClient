// src/lib/socket.ts
import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export const getSocket = () => {
  if (!socket) {
    const url =
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "development"
        ? "http://localhost:5000/api"
        : "https://likesocial.onrender.com/api")
    console.log("url socket", url)
    socket = io(url, {
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
