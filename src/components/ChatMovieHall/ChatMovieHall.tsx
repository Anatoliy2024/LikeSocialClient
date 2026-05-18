import { useAppDispatch, useAppSelector } from "@/store/hooks"
import style from "./ChatMovieHall.module.scss"
import { useEffect, useState } from "react"

import {
  addChatMessage,
  getAllChatMessage,
} from "@/store/slices/cinemaHallSlice"
import { Socket } from "socket.io-client"
import { ChatMessageType } from "@/types/cinemaHall.types"
import { speakText } from "@/utils/speakText"
type ChatMovieHallType = {
  cinemaHallId: string
  groupId: string
  socket: Socket | null
}

export function ChatMovieHall({
  cinemaHallId,
  groupId,
  socket,
}: ChatMovieHallType) {
  const chat = useAppSelector((state) => state.cinemaHall.cinemaHallTarget.chat)
  const dispatch = useAppDispatch()
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
      speakText(data.message.text)
      dispatch(addChatMessage(data.message))
    }
    socket.on("cinema-hall:new-message", handleGetNewMessage)
    return () => {
      socket.off("cinema-hall:new-message", handleGetNewMessage)
    }
  }, [socket, dispatch])
  return (
    <div className={style.ChatMovieHall}>
      <h3>Chat</h3>
      <ul>
        {chat.map((message) => (
          <li key={message.userId}>
            <span>{message.dateAt}</span>
            {message.text}
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
}: ChatMovieHallType) => {
  const [text, setText] = useState("")
  //   const dispatch = useAppDispatch()
  const username = useAppSelector((state) => state.auth.username)

  const handleSendMessage = (text: string) => {
    if (!socket) return
    socket.emit(
      "cinema-hall:send-message",
      { text, cinemaHallId, groupId, username },
      (data: { message: ChatMessageType; error: string }) => {
        setText("")
        if (data.error) return
        // dispatch(addChatMessage(data.message))
      },
    )
  }

  return (
    <div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={() => handleSendMessage(text)}>Отправить</button>
    </div>
  )
}
