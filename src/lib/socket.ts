// src/lib/socket.ts
import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export const getSocket = () => {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === "development"
          ? "http://localhost:5000"
          : "https://likesocial.onrender.com"),
      {
        withCredentials: true,
        autoConnect: false,
      }
    )
  }
  return socket
}
