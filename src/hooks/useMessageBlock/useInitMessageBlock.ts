import { clearMessages } from "@/store/slices/conversationsSlice"
import { updateNotificationIsReadMessage } from "@/store/slices/notificationsSlice"
import { AppDispatch } from "@/store/store"
import { fetchMessagesThunk } from "@/store/thunks/conversationsThunk"
import { MessageType } from "@/types/conversation.types"
import { Dispatch, RefObject, SetStateAction, useEffect } from "react"
import { Socket } from "socket.io-client"

export const useInitMessageBlock = (
  socket: Socket | null,
  conversationId: string,
  dispatch: AppDispatch,
  initializedIdRef: RefObject<string | null>,
  initialScrollDoneRef: RefObject<boolean>,
  initialLastReadIdRef: RefObject<string | null | undefined>,
  hasLoaded: boolean,
  lastReadMessageId: string | null,
  setIsInitialized: Dispatch<SetStateAction<boolean>>,
  //   initializedActiveHandle: () => void,
  messages: MessageType[],
  messagesEndRef: RefObject<HTMLDivElement | null>,
  //   optionRef: RefObject<HTMLDivElement | null>,
  //   closeShowOptionHandler: () => void,
) => {
  useEffect(() => {
    if (!conversationId) return
    if (initializedIdRef.current === conversationId) return

    initializedIdRef.current = conversationId
    initialScrollDoneRef.current = false
    initialLastReadIdRef.current = undefined

    dispatch(clearMessages())
    dispatch(fetchMessagesThunk({ conversationId, direction: "initial" }))

    return () => {
      initializedIdRef.current = null
    }
  }, [conversationId, dispatch])

  useEffect(() => {
    if (!hasLoaded || !socket) return
    if (initialLastReadIdRef.current !== undefined) return

    initialLastReadIdRef.current = lastReadMessageId ?? null
    setIsInitialized(true)
    // initializedActiveHandle()

    // Сразу помечаем всё прочитанным если есть сообщения
    if (messages.length > 0) {
      dispatch(updateNotificationIsReadMessage({ conversationId }))
      const lastMessageId = messages[messages.length - 1]._id
      socket.emit("messages:read", {
        conversationId,
        lastReadMessageId: lastMessageId,
      })
    }
  }, [hasLoaded, socket, conversationId])

  useEffect(() => {
    if (!hasLoaded || initialScrollDoneRef.current) return
    if (messages.length === 0) return

    initialScrollDoneRef.current = true

    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }, [hasLoaded, messages.length])
}
