"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import {
  delConversationThunk,
  delHistoryMessagesThunk,
  fetchMessagesThunk,
} from "@/store/thunks/conversationsThunk"
import { useParams, useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import style from "./MessageBlock.module.scss"
import { getSocket } from "@/lib/socket"
import {
  addMessageFromSocket,
  clearMessages,
  reactionUpdateFromSocket,
  clearPendingNewMessages,
  readUpdateFromSocket,
  messageDeleteFromSocket,
  messageEditedFromSocket,
  // updateLastReadMessageId,
} from "@/store/slices/conversationsSlice"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import { ProfileLink } from "../ProfileLink/ProfileLink"
import Spinner from "../ui/spinner/Spinner"
import Link from "next/link"
import { formatMessageTime } from "@/utils/formatMessageTime"
import { ArrowBack } from "@/assets/icons/arrowBack"
import { SendMessage } from "@/assets/icons/sendMessage"
import { useHideOnScroll } from "@/hooks/useHideOnScroll"
import { formatData } from "@/utils/formatData"
import { TrashThree } from "@/assets/icons/trashThree"
import { Clear } from "@/assets/icons/clear"
import { OptionIcon } from "@/assets/icons/optionIcon"
import { MessageType } from "@/types/conversation.types"
import { StartGroupCallButton } from "../StartGroupCallButton/StartGroupCallButton"
import { GroupCallBanner } from "../GroupCallBanner/GroupCallBanner"
import ConfirmModal from "../ConfirmModal/ConfirmModal"
import { compressImage } from "@/utils/compressImage"
import { fileAPI } from "@/api/api"
import Image from "next/image"
import { MessageReactions } from "../MessageReactions/MessageReactions"
import { MessageModal } from "../MessageModal/MessageModal"
import { StickersBlock } from "../StickersBlock/StickersBlock"
import { Sticker } from "@/assets/icons/sticker"
import { getStickerImage } from "@/utils/getStickerImage"
import { CancelIcon } from "@/assets/icons/CancelIcon"
import { ConfirmIcon } from "@/assets/icons/ConfirmIcon"

export const MessageBlock = () => {
  const router = useRouter()
  const [textMessage, setTextMessage] = useState("")
  const [showOption, setShowOption] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
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
  const [showStickers, setShowStickers] = useState(false)
  const [isEditMessage, setIsEditMessage] = useState({
    messageId: "",
    isEdit: false,
  })
  // const [editText, setEditText] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const optionRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // 🔥 НОВЫЙ: sentinel для автоподгрузки старых сообщений сверху
  const topSentinelRef = useRef<HTMLDivElement>(null)

  // const lastVisibleMessageIdRef = useRef<string | null>(null)
  // const readTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const initialScrollDoneRef = useRef(false)
  const initializedIdRef = useRef<string | null>(null)
  const restoreScrollRef = useRef<{
    top: number
    height: number
  } | null>(null)
  // const prevScrollHeightRef = useRef(0)
  const isAtBottomRef = useRef(isAtBottom)

  useEffect(() => {
    isAtBottomRef.current = isAtBottom
  }, [isAtBottom])

  const initialLastReadIdRef = useRef<string | null | undefined>(undefined)

  const socket = getSocket()
  const dispatch = useAppDispatch()

  const {
    messages,
    currentConversation,
    loading,
    pagination: { hasMoreOlder, hasLoaded },
    lastReadMessageId,
    pendingNewMessages,
    oldestMessageId,
  } = useAppSelector((state) => state.conversations)

  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)
  const userId = useAppSelector((state) => state.auth.userId)
  const optionHeaderMessage = useHideOnScroll()

  const params = useParams<{ id: string }>()
  if (!params || !params.id) throw new Error("Параметр id не найден")
  const id = params.id

  const recipientId = currentConversation?.members.find(
    (member) => member.user._id !== userId
  )?.user

  const isGroup = currentConversation?.type === "group"
  const isOwner = userId === currentConversation?.owner
  const status = usersOnline[recipientId?._id as string] ?? {
    isOnline: false,
    lastSeen: null,
  }

  // ─────────────────────────────────────────
  // Эффект 1: инициализация беседы
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    if (initializedIdRef.current === id) return

    initializedIdRef.current = id
    initialScrollDoneRef.current = false
    initialLastReadIdRef.current = undefined

    dispatch(clearMessages())
    dispatch(fetchMessagesThunk({ conversationId: id, direction: "initial" }))

    return () => {
      initializedIdRef.current = null
    }
  }, [id, dispatch])

  // ─────────────────────────────────────────
  // Эффект 3: начальный скролл после загрузки
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!hasLoaded || initialScrollDoneRef.current) return
    if (messages.length === 0) return

    initialScrollDoneRef.current = true

    // if (lastReadMessageId && dividerRef.current) {
    //   dividerRef.current.scrollIntoView({ block: "center" })
    // } else {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
    // }
  }, [hasLoaded, messages.length])

  // ─────────────────────────────────────────
  // Эффект 4: сокет
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const messageHandler = (data: { message: MessageType }) => {
      dispatch(addMessageFromSocket(data.message))

      // Если мы в чате — сразу помечаем прочитанным
      socket.emit("messages:read", {
        conversationId: id,
        lastReadMessageId: data.message._id,
      })

      if (isAtBottomRef.current) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
          dispatch(clearPendingNewMessages())
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

    socket.emit("conversation:join", id)
    socket.on("message:new", messageHandler)
    socket.on("message:reaction:updated", reactionHandler)
    socket.on("messages:read_update", readUpdateHandler)
    socket.on("message:deleted_update", deleteUpdateHandler)
    socket.on("message:edited_update", editedUpdateHandler)
    // socket.on("messages:read_confirmed", readConfirmedHandler)

    return () => {
      socket.emit("conversation:leave", id)
      socket.off("message:new", messageHandler)
      socket.off("message:reaction:updated", reactionHandler)
      socket.off("messages:read_update", readUpdateHandler)
      socket.off("message:deleted_update", deleteUpdateHandler)
      socket.off("message:edited_update", editedUpdateHandler)

      // socket.off("messages:read_confirmed", readConfirmedHandler)
    }
  }, [id, dispatch, socket])

  useEffect(() => {
    if (!hasLoaded) return
    if (initialLastReadIdRef.current !== undefined) return

    initialLastReadIdRef.current = lastReadMessageId ?? null
    setIsInitialized(true)

    // Сразу помечаем всё прочитанным если есть сообщения
    if (messages.length > 0) {
      const lastMessageId = messages[messages.length - 1]._id
      socket.emit("messages:read", {
        conversationId: id,
        lastReadMessageId: lastMessageId,
      })
    }
  }, [hasLoaded])

  // Убираешь старый useEffect с restoreScrollRef и заменяешь на:
  useLayoutEffect(() => {
    if (!restoreScrollRef.current || messages.length === 0) return

    const { top: prevTop, height: prevHeight } = restoreScrollRef.current
    const newHeight = document.documentElement.scrollHeight
    const diff = newHeight - prevHeight

    if (diff !== 0) {
      document.documentElement.scrollTop = prevTop + diff
    }

    restoreScrollRef.current = null
  }, [messages]) // 🔥 Зависимость от messages — ключевой момент!

  // ─────────────────────────────────────────
  // Отслеживаем позицию скролла — внизу или нет
  // ─────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const threshold = 100
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold

    setIsAtBottom(atBottom)
    if (atBottom) dispatch(clearPendingNewMessages())
  }, [dispatch])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // ─────────────────────────────────────────
  // Click outside option menu
  // ─────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionRef.current && !optionRef.current.contains(e.target as Node)) {
        setShowOption(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ─────────────────────────────────────────
  // Блокировка скролла при просмотре фото
  // ─────────────────────────────────────────
  useEffect(() => {
    if (fullImage) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [fullImage])

  // ─────────────────────────────────────────
  // 🔥 Handlers
  // ─────────────────────────────────────────
  const handleLoadOlder = useCallback(() => {
    if (!hasMoreOlder || loading || !oldestMessageId) return

    // Сохраняем ДО диспатча
    restoreScrollRef.current = {
      top: document.documentElement.scrollTop,
      height: document.documentElement.scrollHeight,
    }

    // Без await — просто запускаем, useLayoutEffect поймает изменение messages
    dispatch(
      fetchMessagesThunk({
        conversationId: id,
        direction: "older",
        cursor: oldestMessageId,
      })
    )
  }, [hasMoreOlder, loading, oldestMessageId, id, dispatch])

  useEffect(() => {
    if (!hasMoreOlder || !topSentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && oldestMessageId) {
          handleLoadOlder()
        }
      },
      {
        threshold: 0.1,
        rootMargin: "-120px 0px 0px 0px", // 🔥 Сработает только в верхней части экрана
      }
    )

    observer.observe(topSentinelRef.current)
    return () => observer.disconnect()
  }, [hasMoreOlder, oldestMessageId, loading, id, handleLoadOlder])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    dispatch(clearPendingNewMessages())
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (imagePreview) URL.revokeObjectURL(imagePreview)
    const compressed = await compressImage(file)
    setSelectedImage(compressed as File)
    setImagePreview(URL.createObjectURL(compressed))
  }

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const handleSendMessage = async () => {
    // console.log("handleSendMessage")
    if (!textMessage.trim() && !selectedImage) return
    try {
      if (selectedImage) {
        setIsUploading(true)
        const data = await fileAPI.uploadChatImage(selectedImage)
        setIsUploading(false)
        socket.emit("message:send", {
          conversationId: id,
          type: "image",
          attachments: [data],
          text: textMessage || undefined,
        })
      } else {
        socket.emit("message:send", {
          conversationId: id,
          type: "text",
          text: textMessage,
        })
      }
      setTextMessage("")
      setSelectedImage(null)
      setImagePreview(null)
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    } catch (error) {
      setIsUploading(false)
      console.log(error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (!isEditMessage.isEdit) {
        handleSendMessage()
      } else {
        handleEditMessage()
      }
    }
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
    e: React.MouseEvent
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
      (m) => m.senderId._id !== userId && m._id > fixedId
    )?._id

    return result ?? null
  }, [messages, userId, isInitialized])

  const handleOpenStickers = () => {
    setShowStickers((prev) => !prev)
    // setShowStickers(true)
  }
  const handleCloseStickers = () => {
    setShowStickers(false)
  }

  const handleSendSticker = (stickerId: string) => {
    socket.emit("message:send", {
      conversationId: id,
      type: "sticker",
      sticker: stickerId,
    })
    handleCloseStickers()
  }
  const handleDeleteMessage = (messageId: string) => {
    // console.log("socket connected:", socket.connected)
    socket.emit("messages:delete", {
      messageId,
    })
    handleCloseCurrentMessage()
  }
  const handleEditMessage = () => {
    // console.log("socket connected:", socket.connected)
    // console.log("отправляю messages:edit", {
    //   messageId: isEditMessage.messageId,
    //   text: textMessage,
    // })
    socket.emit("messages:edit", {
      messageId: isEditMessage.messageId,
      text: textMessage,
    })
    // console.log("handleEditMessage", isEditMessage.messageId)
    handleCloseEditMessage()
    // handleCloseCurrentMessage()
  }

  const handleShowEditMessage = (messageId: string, text?: string) => {
    if (text) {
      // setEditText(text)
      setTextMessage(text)
    }
    handleCloseCurrentMessage()
    setIsEditMessage({ messageId, isEdit: true })
  }
  const handleCloseEditMessage = () => {
    setIsEditMessage({ messageId: "", isEdit: false })
    setTextMessage("")
  }

  if (!currentConversation && loading) {
    return (
      <div style={{ paddingTop: "50px" }}>
        <Spinner />
      </div>
    )
  }

  if (!currentConversation) return <div>Беседа не найдена</div>

  return (
    <div className={style.messageBlock}>
      {activeMessage && messagePosition && (
        <MessageModal
          message={activeMessage}
          position={messagePosition}
          onClose={handleCloseCurrentMessage}
          handleReaction={handleReaction}
          handleDeleteMessage={handleDeleteMessage}
          handleShowEditMessage={handleShowEditMessage}
        />
      )}

      {fullImage && (
        <div
          onClick={() => setFullImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            cursor: "zoom-out",
          }}
        >
          <CloudinaryImage
            src={fullImage}
            alt="full"
            width={1200}
            height={1200}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              width: "auto",
              height: "auto",
              borderRadius: "8px",
            }}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmConfig}
        onCancel={closeConfirm}
        onConfirm={() => {
          confirmConfig?.onConfirm()
          closeConfirm()
        }}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
      />

      {/* ── Шапка ── */}
      <div
        className={`${style.messageBlock__userInfo} ${
          !optionHeaderMessage ? style.messageBlock__moveHeader : ""
        }`}
      >
        <div className={style.messageBlock__userInfoContainer}>
          <Link
            href="/conversations/"
            className={style.messageBlock__buttonBackBlock}
          >
            <ArrowBack />
          </Link>

          {isGroup && (
            <Link
              href={`/conversation/${id}/settings`}
              className={style.messageBlock__groupInfo}
            >
              {currentConversation.avatar && (
                <div className={style.messageBlock__blockImg}>
                  <CloudinaryImage
                    src={currentConversation.avatar}
                    alt="avatar"
                    width={200}
                    height={200}
                  />
                </div>
              )}
              <div className={style.messageBlock__groupInfoMain}>
                <div className={style.messageBlock__groupInfoTitle}>
                  {currentConversation.title}
                </div>
                <div className={style.messageBlock__groupInfoMemberCount}>
                  {currentConversation.members.length} участника(ов)
                </div>
              </div>
            </Link>
          )}

          {currentConversation?.type === "private" && recipientId && (
            <>
              <ProfileLink userId={recipientId._id} currentUserId={userId}>
                <div className={style.messageBlock__userImgOnlineBlock}>
                  <div className={style.messageBlock__blockImg}>
                    <CloudinaryImage
                      src={recipientId.avatar}
                      alt="avatar"
                      width={200}
                      height={200}
                    />
                  </div>
                  {usersOnline[recipientId._id]?.isOnline && (
                    <div className={style.messageBlock__onlineBlock} />
                  )}
                </div>
              </ProfileLink>
              <div>
                <div>{recipientId.username}</div>
                {!status.isOnline && status.lastSeen && (
                  <div className={style.messageBlock__lastSeen}>
                    <span>был(а):</span>{" "}
                    <span>{formatData(status.lastSeen)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <GroupCallBanner groupId={currentConversation._id} />
        </div>

        <div className={style.messageBlock__optionConversation} ref={optionRef}>
          <button
            onClick={() => setShowOption((prev) => !prev)}
            className={`${style.messageBlock__ButtonOption} ${
              showOption ? style.messageBlock__ButtonOptionShow : ""
            }`}
          >
            <OptionIcon />
          </button>
          {showOption && (
            <ul>
              {(isOwner || !isGroup) && (
                <>
                  <li
                    onClick={() =>
                      openConfirm({
                        title: `Удалить ${isGroup ? "группу" : "беседу"}`,
                        message: "Вы уверены? Это действие нельзя отменить.",
                        onConfirm: delConversation,
                      })
                    }
                  >
                    <TrashThree />
                    <span>Удалить {isGroup ? "группу" : "беседу"}</span>
                  </li>
                  <li
                    onClick={() =>
                      openConfirm({
                        title: "Очистить историю",
                        message:
                          "Вы уверены? История будет удалена безвозвратно.",
                        onConfirm: delHistoryMessages,
                      })
                    }
                  >
                    <Clear /> <span>Очистить историю</span>
                  </li>
                </>
              )}
              {isGroup && (
                <li>
                  <StartGroupCallButton groupId={currentConversation._id} />
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* ── Список сообщений ── */}
      <div
        className={style.messageBlock__contentMessageBlock}
        ref={messagesContainerRef}
      >
        {/* 🔥 Sentinel для автоподгрузки старых сообщений (вместо кнопки) */}
        {hasMoreOlder && <div ref={topSentinelRef} style={{ height: 1 }} />}

        {messages.length > 0 && (
          <div className={style.messageBlock__messagesList}>
            {loading && <Spinner />}
            {messages.map((message) => {
              const isUnread =
                message.senderId._id !== userId &&
                !!initialLastReadIdRef.current &&
                message._id > initialLastReadIdRef.current

              const isFirstUnread = message._id === firstUnreadMessageId

              return (
                <div key={message._id}>
                  {isFirstUnread && (
                    <div
                      ref={dividerRef}
                      className={style.messageBlock__unreadDivider}
                    >
                      <span>Новые сообщения</span>
                    </div>
                  )}

                  <div
                    className={style.messageBlock__messageListWrapper}
                    data-message-id={message._id}
                    data-unread={String(isUnread)}
                    onClick={(e) =>
                      handleCurrentMessage(
                        message._id,
                        message.senderId._id === userId,
                        e
                      )
                    }
                  >
                    {isGroup && message.senderId._id !== userId && (
                      <div className={style.messageBlock__senderImage}>
                        <CloudinaryImage
                          src={message.senderId.avatar}
                          alt="avatar"
                          width={200}
                          height={200}
                        />
                      </div>
                    )}
                    <div
                      className={`${style.messageBlock__messageList} ${
                        message.senderId._id !== userId
                          ? style.messageBlock__recipient
                          : style.messageBlock__me
                      } ${isUnread ? style.messageBlock__unread : ""}`}
                    >
                      {message.type === "image" &&
                        message.attachments?.map((att) => (
                          <CloudinaryImage
                            key={att.url}
                            src={att.url}
                            alt="image"
                            width={400}
                            height={400}
                            style={{
                              maxWidth: "250px",
                              borderRadius: "8px",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              if (e) e.stopPropagation()
                              setFullImage(att.url)
                            }}
                          />
                        ))}
                      {message.type === "sticker" && message.sticker && (
                        <Image
                          src={
                            getStickerImage(message.sticker) ||
                            "/stickers/not-found.png"
                          }
                          width={200}
                          height={200}
                          alt={message._id}
                        />
                      )}

                      {message.text && (
                        <div className={style.messageBlock__messageListText}>
                          {message.text}
                        </div>
                      )}

                      <div className={style.messageBlock__otherInfoMessage}>
                        <MessageReactions
                          reactions={message.reactions}
                          messageId={message._id}
                          handleReaction={handleReaction}
                        />
                        <span>{formatMessageTime(message.createdAt)}</span>
                        {message.senderId._id === userId && (
                          <span className={style.messageBlock__readStatus}>
                            {message.readCount > 0 ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Якорь для скролла вниз */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Кнопка "↓ новые сообщения" ── */}
      {pendingNewMessages > 0 && !isAtBottom && (
        <button
          className={style.messageBlock__scrollToBottom}
          onClick={scrollToBottom}
        >
          ↓ {pendingNewMessages} новых
        </button>
      )}

      {/* ── Инпут ── */}

      <div className={style.messageBlock__newMessageBlock}>
        {isEditMessage.isEdit && (
          <div className={style.messageBlock__editTitle}>редактирование</div>
        )}
        <div className={style.messageBlock__newMessageBlockInput}>
          <input
            type="text"
            placeholder="Сообщение"
            onChange={(e) => setTextMessage(e.target.value)}
            value={textMessage}
            onKeyDown={handleKeyDown}
          />
        </div>

        {!isEditMessage.isEdit && (
          <div className={style.messageBlock__newMessageBlockButtons}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageSelect}
            />

            <div className={style.messageBlock__stickers}>
              <div
                className={`${style.messageBlock__stickersButton} ${
                  showStickers ? style.messageBlock__stickersButtonActive : ""
                }`}
                onClick={handleOpenStickers}
              >
                <Sticker />
              </div>
              {showStickers && (
                <StickersBlock
                  onClose={handleCloseStickers}
                  handleSendSticker={handleSendSticker}
                />
              )}
            </div>

            <div className={style.messageBlock__newMessageUploadImage}>
              {imagePreview && (
                <div className={style.messageBlock__imagePreview}>
                  <Image
                    src={imagePreview}
                    width={200}
                    height={200}
                    alt="preview"
                  />
                  <button
                    className={style.messageBlock__imagePreviewCloseWrapper}
                    onClick={() => {
                      if (imagePreview) URL.revokeObjectURL(imagePreview)
                      setSelectedImage(null)
                      setImagePreview(null)
                    }}
                  >
                    <div>✕</div>
                  </button>
                </div>
              )}
              <div
                className={style.messageBlock__newMessageUploadImageButton}
                onClick={() => fileInputRef.current?.click()}
              >
                📎
              </div>
            </div>

            <div
              onClick={!isUploading ? handleSendMessage : undefined}
              title="Отправить сообщение"
              className={style.messageBlock__newMessageButtonBlock}
              style={{
                opacity: isUploading ? 0.5 : 1,
                cursor: isUploading ? "not-allowed" : "pointer",
              }}
            >
              {isUploading ? "..." : <SendMessage />}
            </div>
          </div>
        )}
        {isEditMessage.isEdit && (
          <div className={style.messageBlock__editButton}>
            {/* <div>Редактирование</div>
          <div>editText:{editText}</div> */}
            <div onClick={handleCloseEditMessage}>
              <CancelIcon />
            </div>
            <div onClick={handleEditMessage}>
              <ConfirmIcon />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
