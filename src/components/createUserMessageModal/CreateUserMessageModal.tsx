"use client"
import { useState } from "react"
import style from "./CreateUserMessageModal.module.scss"
import ButtonMenu from "../ui/button/Button"
// import { getSocket } from "@/lib/socket"
import { useRouter } from "next/navigation"
import { useSocket } from "@/providers/SocketProvider"
// import CloseButton from "../ui/closeButton/CloseButton"
export const CreateUserMessageModal = ({
  onClose,
  userId,
  conversationId,
}: {
  onClose: () => void
  userId?: string
  conversationId?: string
}) => {
  const [messageText, setMessageText] = useState("")
  const router = useRouter()
  // const socket = getSocket()
  const socket = useSocket()
  const handleSendMessage = async () => {
    if (!socket) return
    try {
      socket.emit(
        "message:send",
        {
          recipientId: userId,
          type: "text",
          text: messageText,
          conversationId,
        },
        ({
          conversationId,
          error,
        }: {
          conversationId?: string
          error?: string
        }) => {
          // console.log("conversationId******:", conversationId)
          if (conversationId) {
            router.push(`/conversation/${conversationId}`)
          } else if (error) {
            console.log("error:", error)
          }
        },
      )

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
