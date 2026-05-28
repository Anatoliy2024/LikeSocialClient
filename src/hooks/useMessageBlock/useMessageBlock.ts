import { useSocket } from "@/providers/SocketProvider"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import {
  delConversationThunk,
  delHistoryMessagesThunk,
} from "@/store/thunks/conversationsThunk"
import { useRouter } from "next/navigation"
import { useMemo, useRef, useState } from "react"
import { useSocketHandlers } from "./useSocketHandlers"
import { useInitializationData } from "./useInitializationData"
import { useLoadOlderMessages } from "./useLoadOlderMessages"
import { useClickOutside } from "./useClickOutside"
import { useScrollManagement } from "./useScrollManagement"
import { UseMessageBlockReturn } from "@/types/useMessageBlock.types"

export const useMessageBlock = (id: string): UseMessageBlockReturn => {
  const router = useRouter()

  const [showOption, setShowOption] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const [fullImage, setFullImage] = useState<string | null>(null)
  const [currentMessage, setCurrentMessage] = useState<string | null>(null)
  const [messagePosition, setMessagePosition] = useState<{
    top: number
    left: number
    right: number
    isOwn: boolean
  } | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const [isEditMessage, setIsEditMessage] = useState({
    messageId: "",
    isEdit: false,
    text: "",
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const initialScrollDoneRef = useRef(false)
  const initializedIdRef = useRef<string | null>(null)
  const restoreScrollRef = useRef<{
    top: number
    height: number
  } | null>(null)

  const isAtBottomRef = useRef(isAtBottom)

  const initialLastReadIdRef = useRef<string | null | undefined>(undefined)

  const socket = useSocket()

  const dispatch = useAppDispatch()

  const {
    messages,
    currentConversation,
    loading,
    pagination: { hasMoreOlder, hasLoaded },
    lastReadMessageId,

    oldestMessageId,
  } = useAppSelector((state) => state.conversations)

  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)
  const userId = useAppSelector((state: RootState) => state.auth.userId)

  const recipientId = currentConversation?.members.find(
    (member) => member.user._id !== userId,
  )?.user

  const isGroup = currentConversation?.type === "group"
  const isOwner = userId === currentConversation?.owner
  const status = usersOnline[recipientId?._id as string] ?? {
    isOnline: false,
    lastSeen: null,
  }

  useInitializationData(
    socket,
    id,
    dispatch,
    initializedIdRef,
    initialScrollDoneRef,
    initialLastReadIdRef,
    hasLoaded,
    lastReadMessageId,
    setIsInitialized,
    // initializedActiveHandle,
    messages,
    messagesEndRef,
  )
  const optionRef = useClickOutside(setShowOption)

  useSocketHandlers(socket, id, dispatch, isAtBottomRef, messagesEndRef)

  useScrollManagement(
    restoreScrollRef,
    messages,
    messagesContainerRef,
    setIsAtBottom,
    isAtBottomRef,
    fullImage,
  )

  const { topSentinelRef } = useLoadOlderMessages(
    id,
    dispatch,
    hasMoreOlder,
    loading,
    oldestMessageId,
    messagesContainerRef,
    restoreScrollRef,
    // topSentinelRef,
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const delConversation = async () => {
    try {
      await dispatch(delConversationThunk(currentConversation!._id))
      router.push(`/conversations/`)
    } catch (error) {
      console.log(error)
    }
  }

  const delHistoryMessages = () => {
    dispatch(delHistoryMessagesThunk(currentConversation!._id))
  }

  const handleCurrentMessage = (
    messageId: string,
    isOwn: boolean,
    e: React.MouseEvent,
  ) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMessagePosition({
      top: rect.top,
      left: rect.left,
      right: rect.right,
      isOwn,
    })
    setCurrentMessage(messageId)
  }

  const handleCloseCurrentMessage = () => {
    setMessagePosition(null)
    setCurrentMessage(null)
  }

  const handleReaction = (messageId: string, reactionId: string) => {
    if (!socket) return
    socket.emit("message:reaction", { messageId, reactionId })
    if (currentMessage === messageId) setCurrentMessage(null)
  }

  const activeMessage = currentMessage
    ? messages.find((m) => m._id === currentMessage)
    : null

  const openConfirm = (config: typeof confirmConfig) => setConfirmConfig(config)
  const closeConfirm = () => setConfirmConfig(null)

  const firstUnreadMessageId = useMemo(() => {
    if (!isInitialized) return null

    const fixedId = initialLastReadIdRef.current

    if (!fixedId) return null

    const result = messages.find(
      (m) => m.senderId._id !== userId && m._id > fixedId,
    )?._id

    return result ?? null
  }, [messages, userId, isInitialized])

  const handleDeleteMessage = (messageId: string) => {
    if (!socket) return

    socket.emit("messages:delete", {
      messageId,
    })
    handleCloseCurrentMessage()
  }

  const handleShowEditMessage = (messageId: string, text?: string) => {
    handleCloseCurrentMessage()
    setIsEditMessage({ messageId, isEdit: true, text: text || "" })
  }
  const handleCloseEditMessage = () => {
    setIsEditMessage({ messageId: "", isEdit: false, text: "" })
    // setTextMessage("")
  }

  return {
    currentConversation,
    loading,
    messages,
    userId,
    usersOnline,
    activeMessage,
    messagePosition,
    fullImage,
    confirmConfig,
    showOption,
    isAtBottom,
    isEditMessage,
    handleCloseCurrentMessage,
    handleCurrentMessage,
    handleReaction,
    handleDeleteMessage,
    handleShowEditMessage,
    setFullImage,
    closeConfirm,
    openConfirm,
    setShowOption,
    delConversation,
    delHistoryMessages,
    handleCloseEditMessage,
    scrollToBottom,
    isGroup,
    isOwner,
    recipientId,
    status,
    firstUnreadMessageId,
    hasMoreOlder,
    messagesContainerRef,
    messagesEndRef,
    topSentinelRef,
    optionRef,
    dividerRef,
    initialLastReadIdRef,
  }
}
