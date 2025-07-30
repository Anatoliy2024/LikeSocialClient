"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { getUserMessagesThunk } from "@/store/thunks/dialogsThunk"

import { useParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import style from "./MessageBlock.module.scss"
import { getSocket } from "@/lib/socket"
import {
  addMessageFromSocket,
  changeCurrantPage,
  clearMessages,
  MessageType,
} from "@/store/slices/dialogsSlice"

import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"

import { ProfileLink } from "../ProfileLink/ProfileLink"
import Spinner from "../ui/spinner/Spinner"
import Link from "next/link"
// import { useHideOnScroll } from "@/hooks/useHideOnScroll"
import { formatMessageTime } from "@/utils/formatMessageTime"
import { ArrowBack } from "@/assets/icons/arrowBack"
import { SendMessage } from "@/assets/icons/sendMessage"
import { useHideOnScroll } from "@/hooks/useHideOnScroll"

export const MessageBlock = () => {
  const [textMessage, setTextMessage] = useState("")
  // const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  // const prevTouchY = useRef<number | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const joinedRef = useRef(false)
  const socket = getSocket()
  const dispatch = useAppDispatch()
  // const messages = useAppSelector((state: RootState) => state.dialogs.messages)
  const { messages, hasMore, currentPage, currentDialog, loading, hasLoaded } =
    useAppSelector((state) => state.dialogs)
  // const { hasLoaded } = useAppSelector((state) => state.dialogs)
  const userId = useAppSelector((state) => state.auth.userId)

  const recipientId = currentDialog?.members.find(
    (member) => member._id !== userId
  )
  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)

  const { id } = useParams<{ id: string }>()

  // Загружаем сообщения при изменении диалога (первый заход)
  useEffect(() => {
    if (!id || joinedRef.current) return

    const messageHandler = (message: MessageType) => {
      console.log("New message", message)
      dispatch(addMessageFromSocket(message))
    }

    dispatch(clearMessages())
    dispatch(getUserMessagesThunk({ dialogId: id, page: 1 }))

    socket.emit("joinDialog", id)
    socket.on("newMessage", messageHandler)

    joinedRef.current = true

    return () => {
      socket.emit("leaveDialog", id)
      socket.off("newMessage", messageHandler)
      joinedRef.current = false
    }
  }, [id, dispatch, socket])

  useEffect(() => {
    if (!id || currentPage === 1 || hasLoaded === false) return
    dispatch(getUserMessagesThunk({ dialogId: id, page: currentPage }))
  }, [dispatch, currentPage, id, hasLoaded])

  // useEffect(() => {
  //   // При загрузке сообщений скроллим к низу
  //   if (!hasLoaded) return
  //   // window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
  //   // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  //   // scrollContainerRef.current?.scrollIntoView({ behavior: "smooth" })
  //   const container = scrollContainerRef.current
  //   if (!container) return
  //   container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
  // }, [hasLoaded])

  const lastMessageRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return

      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            dispatch(changeCurrantPage())
          }
        },
        {
          threshold: 1, // 👈 Весь элемент должен быть в зоне видимости
          // rootMargin: "0px 0px -100px 0px",
        }
      )

      if (node) observerRef.current.observe(node)
    },
    [loading, hasMore, dispatch]
  )
  const optionHeaderMessage = useHideOnScroll()
  // useEffect(() => {
  //   const container = scrollContainerRef.current
  //   if (!container) return

  //   const handleWheel = (e: WheelEvent) => {
  //     const isAtTop = container.scrollTop === 0
  //     const isScrollingUp = e.deltaY < 0

  //     if (isAtTop && isScrollingUp && hasMore && !loading) {
  //       console.log("Загрузка сообщений (wheel)")
  //       dispatch(changeCurrantPage())
  //     }
  //   }

  //   const handleTouchMove = (e: TouchEvent) => {
  //     const touch = e.touches[0]
  //     const currentY = touch.clientY

  //     if (prevTouchY.current !== null) {
  //       const deltaY = currentY - prevTouchY.current
  //       const isScrollingUp = deltaY > 0
  //       const isAtTop = container.scrollTop === 0

  //       if (isAtTop && isScrollingUp && hasMore && !loading) {
  //         console.log("Загрузка сообщений (touch)")
  //         dispatch(changeCurrantPage())
  //       }
  //     }

  //     prevTouchY.current = currentY
  //   }

  //   const handleTouchEnd = () => {
  //     prevTouchY.current = null
  //   }

  //   container.addEventListener("wheel", handleWheel, { passive: true })
  //   container.addEventListener("touchmove", handleTouchMove, { passive: true })
  //   container.addEventListener("touchend", handleTouchEnd)

  //   return () => {
  //     container.removeEventListener("wheel", handleWheel)
  //     container.removeEventListener("touchmove", handleTouchMove)
  //     container.removeEventListener("touchend", handleTouchEnd)
  //   }
  // }, [hasMore, loading, dispatch])

  // useEffect(() => {
  //   document.body.style.overflow = "hidden"
  //   document.body.style.overscrollBehavior = "none"
  //   return () => {
  //     document.body.style.overflow = ""
  //     document.body.style.overscrollBehavior = ""
  //   }
  // }, [])

  // const optionHeaderMessage = useHideOnScroll()
  if (!recipientId) return <div>Диалог не найден</div>

  const handleSendMessage = async () => {
    try {
      socket.emit("sendMessage", {
        recipientUserId: recipientId._id,
        text: textMessage,
        id,
      })
      // setTimeout(() => {
      //   // window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
      //   // scrollContainerRef.current?.scrollTo({ behavior: "smooth" })

      //   const container = scrollContainerRef.current
      //   if (!container) return
      window.scrollTo({ top: 0, behavior: "smooth" })
      // container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
      // }, 500)

      setTextMessage("")
    } catch (error) {
      console.log(error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault() // чтобы не было лишних переносов
      handleSendMessage()
    }
  }

  return (
    <div className={style.container}>
      <div
        className={`${style.userInfo}
          ${!optionHeaderMessage ? style.moveHeaderMessage : ""}`}
      >
        <Link href={"/dialogs/"} className={style.buttonBackBlock}>
          <ArrowBack />
        </Link>
        <ProfileLink userId={recipientId._id} currentUserId={userId}>
          <div className={style.userImgOnlineBlock}>
            <div className={style.blockImg}>
              <CloudinaryImage
                src={recipientId.avatar}
                alt="avatar"
                width={200}
                height={200}
              />
            </div>
            {usersOnline[recipientId._id]?.isOnline && (
              <div className={style.onlineBlock}></div>
            )}
          </div>
        </ProfileLink>
        <div>
          <div>{recipientId.username}</div>
        </div>
      </div>

      {/* <h2>dialog</h2> */}
      <div className={style.contentMessageBlock}>
        {messages.length > 0 && (
          <div className={style.messagesList}>
            {messages.map((message, i) => {
              const isLast = i === messages.length - 1
              return (
                <div
                  key={message._id}
                  className={`${style.messageList} ${
                    message.senderId._id !== userId ? style.recipient : style.me
                  }`}
                  ref={isLast ? lastMessageRef : null}
                >
                  <div>{message.text}</div>
                  <div>{formatMessageTime(message.createdAt)}</div>
                </div>
              )
            })}
            {loading && <Spinner />}
          </div>
        )}

        {/* <div ref={messagesEndRef} /> */}
      </div>
      <div
        className={`${style.newMessageBlock} ${
          !optionHeaderMessage ? style.moveHeaderMessage : ""
        }`}
      >
        <div className={style.newMessageBlockInput}>
          <input
            type="text"
            placeholder="Сообщение"
            onChange={(e) => setTextMessage(e.target.value)}
            value={textMessage}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div
          onClick={handleSendMessage}
          title="Отправить сообщение"
          className={style.newMessageButtonBlock}
        >
          <SendMessage />
        </div>
      </div>
    </div>
  )
}
