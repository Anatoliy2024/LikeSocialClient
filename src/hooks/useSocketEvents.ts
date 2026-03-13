"use client"

import { useEffect } from "react"
import { useAppDispatch } from "@/store/hooks"
import { destroySocket, getSocket } from "@/lib/socket"
import {
  setOnlineStatusList,
  updateUserStatus,
} from "@/store/slices/onlineStatusSlice"
import {
  addNotification,
  dellNotification,
  updateNotification,
} from "@/store/slices/notificationsSlice"
import { notificationsType } from "@/store/thunks/notificationsThunk"

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

    const newNotification = (notification: {
      type?: "create" | "delete" | "update"
      notification: notificationsType
    }) => {
      if (!notification?.type) {
        // console.log("notification.type нету")
        dispatch(addNotification(notification))
      } else if (notification.type === "delete") {
        // console.log("notification.type == delete", notification)
        dispatch(dellNotification(notification))
      } else if (notification.type === "update") {
        // console.log("notification.type == update", notification)

        dispatch(updateNotification(notification))
      }
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
    socket.on("new-notification", newNotification)

    return () => {
      socket.off("user-status-changed")
      socket.off("online-users")
      socket.off("new-notification", newNotification)
    }
  }, [userId, dispatch])
}
