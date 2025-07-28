"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { getUserMessagesThunk } from "@/store/thunks/dialogsThunk"
// import Image from "next/image"
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
// import { formatData } from "@/utils/formatData"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import ButtonMenu from "../ui/button/Button"
import { CreateUserMessageModal } from "../createUserMessageModal/CreateUserMessageModal"

import { ProfileLink } from "../ProfileLink/ProfileLink"
import Spinner from "../ui/spinner/Spinner"
import Link from "next/link"
import { useHideOnScroll } from "@/hooks/useHideOnScroll"
import { formatMessageTime } from "@/utils/formatMessageTime"
import { ArrowBack } from "@/assets/icons/arrowBack"

export const MessageBlock = () => {
  const [showModalCreateMessage, setShowModalCreateMessage] = useState(false)
  // const loaderRef = useRef<HTMLDivElement | null>(null)
  // const throttleRef = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const joinedRef = useRef(false)
  const socket = getSocket()
  const dispatch = useAppDispatch()
  // const messages = useAppSelector((state: RootState) => state.dialogs.messages)
  const { messages, hasMore, currentPage, currentDialog, loading } =
    useAppSelector((state) => state.dialogs)

  const userId = useAppSelector((state) => state.auth.userId)

  const recipientId = currentDialog?.members.find(
    (member) => member._id !== userId
  )
  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)

  const { id } = useParams<{ id: string }>()
  useEffect(() => {
    dispatch(getUserMessagesThunk({ dialogId: id, page: currentPage }))
  }, [dispatch, currentPage, id])

  useEffect(() => {
    if (!id || joinedRef.current) return

    const messageHandler = (message: MessageType) => {
      console.log("New message", message)
      dispatch(addMessageFromSocket(message))
    }
    dispatch(clearMessages())
    socket.emit("joinDialog", id)
    socket.on("newMessage", messageHandler)
    //  socket.on("online-users", (users) => {
    //       dispatch(setOnlineStatusList(users))
    //       console.log("Сейчас онлайн:", users)
    //       // Тут можешь диспатчить в стор, если хочешь хранить онлайн список
    //     })
    joinedRef.current = true

    return () => {
      socket.emit("leaveDialog", id)
      socket.off("newMessage", messageHandler) // отписка от события
      joinedRef.current = false
    }
  }, [id, socket, dispatch])

  // console.log("id", id)
  // console.log("messages", messages)

  const handleShowModalCreateMessage = () => {
    setShowModalCreateMessage(true)
  }
  const handleCloseModalCreateMessage = () => {
    setShowModalCreateMessage(false)
  }
  // console.log("messages**", messages)

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
  if (!recipientId) return <div>Диалог не найден</div>
  // const lastSeen = status?.isOnline ? null : status?.lastSeen ?? profileLastSeen
  // console.log(
  //   "usersOnline[recipientId._id]?.lastSeen",
  //   usersOnline[recipientId._id]?.lastSeen
  // )

  return (
    <>
      {showModalCreateMessage && recipientId && (
        <CreateUserMessageModal
          onClose={handleCloseModalCreateMessage}
          userId={recipientId._id}
          dialogId={id}
        />
      )}
      <div className={style.container}>
        <div
          className={`${style.userInfo} ${
            !optionHeaderMessage ? style.moveHeaderMessage : ""
          }`}
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
            {/* <div>{usersOnline[recipientId._id]?.lastSeen}</div> */}
          </div>
        </div>

        {/* <h2>dialog</h2> */}
        <div className={style.contentMessageBlock}>
          <ButtonMenu onClick={handleShowModalCreateMessage}>
            Написать сообщение
          </ButtonMenu>

          <div id="scrollArea">
            {messages.length > 0 && (
              <div className={style.messagesList}>
                {messages.map((message, i) => {
                  const isLast = i === messages.length - 1
                  return (
                    <div
                      key={message._id}
                      className={`${style.messageList} ${
                        message.senderId._id !== userId
                          ? style.recipient
                          : style.me
                      }`}
                      ref={isLast ? lastMessageRef : null}
                      // style={recipientId._id === userId ?{}:''}
                    >
                      <div>{message.text}</div>
                      <div>{formatMessageTime(message.createdAt)}</div>
                    </div>
                  )
                })}
              </div>
            )}
            {loading && <Spinner />}
          </div>
        </div>
      </div>
    </>
  )
}
