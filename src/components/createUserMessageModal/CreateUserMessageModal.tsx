"use client"
import { useState } from "react"
import style from "./CreateUserMessageModal.module.scss"
import ButtonMenu from "../ui/button/Button"
import { getSocket } from "@/lib/socket"
// import CloseButton from "../ui/closeButton/CloseButton"
export const CreateUserMessageModal = ({
  onClose,
  userId,
  dialogId,
}: {
  onClose: () => void
  userId?: string
  dialogId?: string
}) => {
  const [messageText, setMessageText] = useState("")
  const socket = getSocket()
  const handleSendMessage = async () => {
    try {
      socket.emit("sendMessage", {
        recipientUserId: userId,
        text: messageText,
        dialogId,
      })

      onClose()
    } catch (error) {
      console.log(error)
    }
  }
  return (
    <div className={style.wrapper}>
      <div className={style.container}>
        <h2>Новое сообщение</h2>
        {/* <div className={style.buttonCloseBlock}>
          <CloseButton onClick={onClose} title="Закрыть" />
        </div> */}
        <textarea
          onChange={(e) => setMessageText(e.currentTarget.value)}
          value={messageText}
        />
        <div className={style.buttonBlock}>
          <ButtonMenu
            onClick={() => {
              handleSendMessage()
            }}
          >
            Отправить
          </ButtonMenu>
          <ButtonMenu onClick={onClose}>Отмена</ButtonMenu>
        </div>
      </div>
    </div>
  )
}
