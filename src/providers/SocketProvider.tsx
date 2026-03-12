"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { Socket } from "socket.io-client"
import { getSocket, destroySocket } from "@/lib/socket"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { useSocketEvents } from "@/hooks/useSocketEvents"
import NotificationProvider from "./NotificationProvider"

const SocketContext = createContext<Socket | null>(null)

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const userId = useAppSelector((state: RootState) => state.auth.userId)
  // const socketRef = useRef<Socket | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!userId) {
      destroySocket()
      setSocket(null)
      return
    }

    const token = localStorage.getItem("accessToken")
    if (!token) return

    const socket = getSocket(token)

    if (!socket.connected) {
      socket.connect()
    }
    setSocket(socket)
    // socketRef.current = socket
    // console.log("socket", socket)

    return () => {
      socket.off()
    }
  }, [userId])

  useSocketEvents(userId)

  return (
    <SocketContext.Provider value={socket}>
      <NotificationProvider>{children}</NotificationProvider>
    </SocketContext.Provider>
  )
}
