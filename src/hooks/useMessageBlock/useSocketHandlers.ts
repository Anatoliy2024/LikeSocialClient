import {
  addMessageFromSocket,
  messageDeleteFromSocket,
  messageEditedFromSocket,
  reactionUpdateFromSocket,
  readUpdateFromSocket,
} from "@/store/slices/conversationsSlice"
import { AppDispatch } from "@/store/store"
import { MessageType } from "@/types/conversation.types"
import { RefObject, useEffect } from "react"
import { Socket } from "socket.io-client"

export const useSocketHandlers = (
  socket: Socket | null,
  conversationId: string,
  dispatch: AppDispatch,
  isAtBottomRef: RefObject<boolean>,
  messagesEndRef: RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    if (!socket) return

    const messageHandler = (data: { message: MessageType }) => {
      dispatch(addMessageFromSocket(data.message))

      // Если мы в чате — сразу помечаем прочитанным
      // markAsRead(data.message._id)
      socket.emit("messages:read", {
        conversationId,
        lastReadMessageId: data.message._id,
      })

      if (isAtBottomRef.current) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
          // dispatch(clearPendingNewMessages())
        })
      }
    }

    const reactionHandler = (data: {
      messageId: string
      reactions: MessageType["reactions"]
    }) => {
      dispatch(reactionUpdateFromSocket(data))
    }

    const readUpdateHandler = (data: {
      userId: string
      lastReadMessageId: string
    }) => {
      dispatch(readUpdateFromSocket(data))
    }
    const deleteUpdateHandler = (data: { messageId: string }) => {
      dispatch(messageDeleteFromSocket(data))
    }
    const editedUpdateHandler = (data: {
      messageId: string
      text: string
      isEdited: boolean
      editedAt: string
    }) => {
      dispatch(messageEditedFromSocket(data))
    }

    socket.emit("conversation:join", conversationId)
    socket.on("message:new", messageHandler)
    socket.on("message:reaction:updated", reactionHandler)
    socket.on("messages:read_update", readUpdateHandler)
    socket.on("message:deleted_update", deleteUpdateHandler)
    socket.on("message:edited_update", editedUpdateHandler)
    // socket.on("messages:read_confirmed", readConfirmedHandler)

    return () => {
      socket.emit("conversation:leave", conversationId)
      socket.off("message:new", messageHandler)
      socket.off("message:reaction:updated", reactionHandler)
      socket.off("messages:read_update", readUpdateHandler)
      socket.off("message:deleted_update", deleteUpdateHandler)
      socket.off("message:edited_update", editedUpdateHandler)

      // socket.off("messages:read_confirmed", readConfirmedHandler)
    }
  }, [conversationId, dispatch, socket])
}
