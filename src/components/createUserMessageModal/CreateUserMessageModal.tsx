"use client"
import { useState } from "react"
import style from "./CreateUserMessageModal.module.scss"
import ButtonMenu from "../ui/button/Button"
import { getSocket } from "@/lib/socket"
export const CreateUserMessageModal = ({
  onClose,
  userId,
}: {
  onClose: () => void
  userId: string
}) => {
  const [messageText, setMessageText] = useState("")
  const socket = getSocket()
  const handleSendMessage = async () => {
    try {
      socket.emit("sendMessage", {
        recipientUserId: userId,
        text: messageText,
      })

      onClose()
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div className={style.wrapper} onClick={onClose}>
      <div className={style.container} onClick={(e) => e.stopPropagation()}>
        <textarea
          onChange={(e) => setMessageText(e.currentTarget.value)}
          value={messageText}
        />
        <ButtonMenu
          onClick={() => {
            handleSendMessage()
          }}
        >
          Отправить
        </ButtonMenu>
      </div>
    </div>
  )
}
