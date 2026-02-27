"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import {
  delConversationThunk,
  delHistoryMessagesThunk,
  fetchMessagesThunk,
} from "@/store/thunks/conversationsThunk"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import style from "./MessageBlock.module.scss"
import { getSocket } from "@/lib/socket"
import {
  addMessageFromSocket,
  incrementPage,
  clearMessages,
  reactionUpdateFromSocket,
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
import { BackgroundModal } from "../BackgroundModal/BackgroundModal"
import { ModalCurrentMessage } from "../ModalCurrentMessage/ModalCurrentMessage"

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openConfirm = (config: typeof confirmConfig) => setConfirmConfig(config)
  const closeConfirm = () => setConfirmConfig(null)

  const optionRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  // Защита от двойного монтирования в React StrictMode
  const initializedIdRef = useRef<string | null>(null)
  // Блокировка повторного incrementPage пока идёт загрузка
  const isLoadingMoreRef = useRef(false)

  const socket = getSocket()
  const dispatch = useAppDispatch()

  const {
    messages,
    currentConversation,
    loading,
    pagination: { hasMore, hasLoaded, page },
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

  // ───────────────────────────────────────────────
  // Эффект 1: инициализация беседы (первая страница)
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    if (initializedIdRef.current === id) return

    initializedIdRef.current = id
    isLoadingMoreRef.current = false

    dispatch(clearMessages())
    dispatch(fetchMessagesThunk({ conversationId: id, page: 1 }))

    return () => {
      initializedIdRef.current = null
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ───────────────────────────────────────────────
  // Эффект 2: подключение сокета
  // Намеренно без зависимостей — сокет живёт на всё время монтирования.
  // Если роутинг размонтирует компонент при смене беседы — этого достаточно.
  // ───────────────────────────────────────────────
  useEffect(() => {
    const messageHandler = (data: { message: MessageType }) => {
      // console.log("message:new получен:", data.message.type, data.message)
      dispatch(addMessageFromSocket(data.message))
    }
    const reactionHandler = (data: {
      messageId: string
      reactions: MessageType["reactions"]
    }) => {
      // console.log("message:new получен:", data.message.type, data.message)
      dispatch(reactionUpdateFromSocket(data))
    }

    socket.emit("conversation:join", id)
    socket.on("message:new", messageHandler)
    socket.on("message:reaction:updated", reactionHandler)

    return () => {
      socket.emit("conversation:leave", id)
      socket.off("message:new", messageHandler)
      socket.off("message:reaction:updated", reactionHandler)
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ───────────────────────────────────────────────
  // Эффект 3: подгрузка следующих страниц
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (!id || page === 1 || !hasLoaded) return
    if (currentConversation?._id !== id) return

    dispatch(fetchMessagesThunk({ conversationId: id, page }))
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  // ───────────────────────────────────────────────
  // Сброс флага блокировки когда загрузка завершилась
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (!loading) {
      isLoadingMoreRef.current = false
    }
  }, [loading])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionRef.current && !optionRef.current.contains(e.target as Node)) {
        setShowOption(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (fullImage) {
      // при монтировании — запрещаем прокрутку
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    // при размонтировании — возвращаем как было
    return () => {
      document.body.style.overflow = ""
    }
  }, [fullImage])

  // ───────────────────────────────────────────────
  // IntersectionObserver для пагинации
  // ───────────────────────────────────────────────
  const lastMessageRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }

      if (!node || loading || !hasLoaded || !hasMore) return

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return
          if (!hasMore) return
          if (isLoadingMoreRef.current) return

          isLoadingMoreRef.current = true
          dispatch(incrementPage())
        },
        { threshold: 0.5 }
      )

      observerRef.current.observe(node)
    },
    [loading, hasMore, hasLoaded, dispatch]
  )

  if (!currentConversation && loading) {
    return (
      <div style={{ paddingTop: "50px" }}>
        <Spinner />
      </div>
    )
  }

  if (!currentConversation) return <div>Беседа не найдена</div>

  // const handleSendMessage = async () => {
  //   if (!textMessage.trim()) return
  //   try {
  //     socket.emit("message:send", {
  //       conversationId: id,
  //       type: "text",
  //       text: textMessage,
  //     })
  //     window.scrollTo({ top: 0, behavior: "smooth" })
  //     setTextMessage("")
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const compressed = await compressImage(file)

    console.log(
      `***********************************************До: ${(
        file.size / 1024
      ).toFixed(2)} KB | После: ${(compressed.size / 1024).toFixed(2)} KB`
    )

    setSelectedImage(compressed as File)
    setImagePreview(URL.createObjectURL(compressed))
  }

  const handleSendMessage = async () => {
    if (!textMessage.trim() && !selectedImage) return

    try {
      if (selectedImage) {
        setIsUploading(true)

        const data = await fileAPI.uploadChatImage(selectedImage)

        setIsUploading(false)

        socket.emit("message:send", {
          conversationId: id,
          type: "image",
          attachments: [data], // url, publicId, fileName, fileSize, mimeType, expiresAt
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
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      setIsUploading(false)
      console.log(error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const delConversation = async () => {
    try {
      await dispatch(delConversationThunk(currentConversation._id))
      router.push(`/conversations/`)
    } catch (error) {
      console.log(error)
    }
  }

  const delHistoryMessages = () => {
    dispatch(delHistoryMessagesThunk(currentConversation._id))
  }

  const handleShowOption = () => {
    setShowOption((prev) => !prev)
  }

  const handleCurrentMessage = (messageId: string) => {
    setCurrentMessage(messageId)
  }
  const handleCloseCurrentMessage = () => {
    setCurrentMessage(null)
    // console.log("handleCloseCurrentMessage", currentMessage)
  }

  const handleReaction = (messageId: string, reactionId: string) => {
    socket.emit("message:reaction", {
      messageId,
      reactionId,
    })
    if (currentMessage) {
      setCurrentMessage(null)
    }
    // console.log("currentMessage", currentMessage)
  }

  console.log("messages", messages)
  return (
    <div className={style.messageBlock}>
      {currentMessage && (
        <BackgroundModal onClose={handleCloseCurrentMessage} />
      )}
      {/* Модалка просмотра */}
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
      <div
        className={`${style.messageBlock__userInfo} ${
          !optionHeaderMessage ? style.messageBlock__moveHeaderMessage : ""
        }`}
      >
        <div className={style.messageBlock__userInfoContainer}>
          <Link
            href={"/conversations/"}
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
                    <div className={style.messageBlock__onlineBlock}></div>
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
            onClick={handleShowOption}
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

      <div
        className={`${style.messageBlock__newMessageBlock} ${
          !optionHeaderMessage ? style.messageBlock__moveHeaderMessage : ""
        }`}
      >
        <div className={style.messageBlock__newMessageBlockInput}>
          <input
            type="text"
            placeholder="Сообщение"
            onChange={(e) => setTextMessage(e.target.value)}
            value={textMessage}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className={style.messageBlock__newMessageBlockButtons}>
          {/* скрытый input — просто кидаем здесь */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageSelect}
          />

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
      </div>

      <div className={style.messageBlock__contentMessageBlock}>
        {messages.length > 0 && (
          <div className={style.messageBlock__messagesList}>
            {messages.map((message, i) => {
              const isLast = i === messages.length - 1
              console.log("message*******", message)
              // console.log("message.reactions*******", message.reactions)
              return (
                <div
                  key={message._id}
                  className={style.messageBlock__messageListWrapper}
                  ref={isLast ? lastMessageRef : null}
                  onClick={() => handleCurrentMessage(message._id)}
                >
                  {isGroup && message.senderId._id !== userId && (
                    // <div className={style.messageBlock__senderImage}>
                    <div className={style.messageBlock__senderImage}>
                      <CloudinaryImage
                        src={message.senderId.avatar}
                        alt="avatar"
                        width={200}
                        height={200}
                      />
                    </div>

                    // </div>
                  )}
                  <div
                    className={`${style.messageBlock__messageList} ${
                      message.senderId._id !== userId
                        ? style.messageBlock__recipient
                        : style.messageBlock__me
                    }`}
                  >
                    {currentMessage === message._id && (
                      <ModalCurrentMessage
                        messageId={message._id}
                        reactions={message.reactions}
                        handleReaction={handleReaction}
                        // message={message}
                      />
                    )}

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
                            if (e) {
                              e.stopPropagation() // добавь это
                            }
                            setFullImage(att.url)
                          }}
                        />
                      ))}

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
                    </div>
                  </div>
                </div>
              )
            })}
            {loading && <Spinner />}
          </div>
        )}
      </div>
    </div>
  )
}
