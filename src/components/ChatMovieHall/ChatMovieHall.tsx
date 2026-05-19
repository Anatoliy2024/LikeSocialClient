import { useAppDispatch, useAppSelector } from "@/store/hooks"
import style from "./ChatMovieHall.module.scss"
import { useEffect, useRef, useState } from "react"

import {
  addChatMessage,
  getAllChatMessage,
} from "@/store/slices/cinemaHallSlice"
import { Socket } from "socket.io-client"
import { ChatMessageType } from "@/types/cinemaHall.types"
import { speakText } from "@/utils/speakText"

import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
export type ChatMovieHallType = {
  cinemaHallId: string
  groupId: string
  socket: Socket | null
  showChat: boolean
  isFullscreen: boolean
}

export function ChatMovieHall({
  cinemaHallId,
  groupId,
  socket,
  showChat,
  isFullscreen,
}: ChatMovieHallType) {
  const chat = useAppSelector((state) => state.cinemaHall.cinemaHallTarget.chat)
  const userId = useAppSelector((state) => state.auth.userId)
  const dispatch = useAppDispatch()
  const chatListRef = useRef<HTMLUListElement>(null)
  // 👇 Этот эффект срабатывает каждый раз, когда меняется массив 'chat'
  useEffect(() => {
    // Если список существует и в нём есть сообщения
    if (chatListRef.current) {
      // Магическая команда: прокрутить в самый-самый низ
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight
    }
  }, [chat]) // <--- Следим за изменениями в чате

  useEffect(() => {
    if (!socket) return
    socket.emit(
      "cinema-hall:get-all-messages",
      { cinemaHallId, groupId },
      (data: { messages: string }) => {
        dispatch(getAllChatMessage(data.messages))
      },
    )
  }, [socket, cinemaHallId, groupId, dispatch])

  useEffect(() => {
    if (!socket) return

    const handleGetNewMessage = (data: { message: ChatMessageType }): void => {
      console.log("Пришло новое сообщение ", data.message)
      if (userId !== data.message.userId) {
        speakText(data.message.text)
      }
      dispatch(addChatMessage(data.message))
    }
    socket.on("cinema-hall:new-message", handleGetNewMessage)
    return () => {
      socket.off("cinema-hall:new-message", handleGetNewMessage)
    }
  }, [socket, dispatch])
  return (
    <div
      className={`${style.ChatMovieHall} ${!showChat ? style.hidden : ""} ${isFullscreen ? style.fullscreen : ""} `}
    >
      <h3>Chat</h3>

      <ul ref={chatListRef}>
        <div style={{ flex: 1, minHeight: 0 }} />
        {chat.map((message) => (
          <li key={message.id}>
            {/* <span>{getHoursMinutes(message.dateAt)}</span> */}
            <div className={style.ChatMovieHall__imgContainer}>
              <CloudinaryImage
                src={message.avatar ? message.avatar : "/images/anonym.jpeg"}
                alt="avatar"
                width={70}
                height={70}
              />
            </div>
            <span>{message.text}</span>
          </li>
        ))}
      </ul>
      <InputChatMovieHall
        cinemaHallId={cinemaHallId}
        groupId={groupId}
        socket={socket}
      />
    </div>
  )
}

const InputChatMovieHall = ({
  cinemaHallId,
  groupId,
  socket,
}: Omit<ChatMovieHallType, "showChat" | "isFullscreen">) => {
  const [textMessage, setTextMessage] = useState("")
  //   const dispatch = useAppDispatch()
  const username = useAppSelector((state) => state.auth.username)
  const avatar = useAppSelector((state) => state.auth.avatar)

  const handleSendMessage = (text: string) => {
    if (!socket) return
    if (!text.trim()) return
    console.log("text", text)
    socket.emit(
      "cinema-hall:send-message",
      { text, cinemaHallId, groupId, username, avatar },
      (data: { message: ChatMessageType; error: string }) => {
        setTextMessage("")
        if (data.error) return
        // dispatch(addChatMessage(data.message))
      },
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSendMessage(textMessage)
    }
  }

  return (
    <div className={style.InputChatMovieHall}>
      <input
        type="text"
        value={textMessage}
        onChange={(e) => setTextMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button onClick={() => handleSendMessage(textMessage)}>&#10148;</button>
    </div>
  )
}
