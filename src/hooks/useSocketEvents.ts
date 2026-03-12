"use client"

import { useEffect } from "react"
import { useAppDispatch } from "@/store/hooks"
import { destroySocket, getSocket } from "@/lib/socket"
import {
  setOnlineStatusList,
  updateUserStatus,
} from "@/store/slices/onlineStatusSlice"
import { addNotification } from "@/store/slices/notificationsSlice"

export const useSocketEvents = (userId: string | null) => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!userId) {
      destroySocket()
      return
    }

    const token = localStorage.getItem("accessToken")
    if (!token) return

    const socket = getSocket(token)

    if (!socket.connected) {
      socket.connect()
    }

    socket.emit("user-connected", userId)
    socket.emit("get-online-users")

    socket.off("user-status-changed")
    socket.on("user-status-changed", ({ userId, status }) => {
      dispatch(updateUserStatus({ userId, status }))
    })

    socket.off("online-users")
    socket.on("online-users", (users) => {
      dispatch(setOnlineStatusList(users))
    })

    socket.off("new-notification")
    socket.on("new-notification", (notification) => {
      dispatch(addNotification(notification))
    })

    return () => {
      socket.off("user-status-changed")
      socket.off("online-users")
      socket.off("new-notification")
    }
  }, [userId, dispatch])
}
