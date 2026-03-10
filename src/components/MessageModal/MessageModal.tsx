"use client"
import { createPortal } from "react-dom"
import { MessageType } from "@/types/conversation.types"
import { ModalCurrentMessage } from "../ModalCurrentMessage/ModalCurrentMessage"
import style from "./MessageModal.module.scss"

interface Props {
  message: MessageType
  position: { top: number; left: number; right: number; isOwn: boolean }
  isGroup: boolean
  onClose: () => void
  handleReaction: (messageId: string, reactionId: string) => void
  handleDeleteMessage: (messageId: string) => void
  handleShowEditMessage: (messageId: string, text?: string) => void
}

const MODAL_WIDTH = 300
const MODAL_HEIGHT = 250

const getModalPosition = (position: {
  top: number
  left: number
  right: number
  isOwn: boolean
}) => {
  const { top, left, right, isOwn } = position

  // Вертикаль — выше если влезает, иначе ниже
  const adjustedTop = top - MODAL_HEIGHT > 60 ? top - MODAL_HEIGHT : top + 50

  // Горизонталь — своё сообщение (справа) → модалка справа
  // чужое сообщение (слева) → модалка слева
  let adjustedLeft: number
  if (isOwn) {
    // Прижимаем к правому краю сообщения
    adjustedLeft = right - MODAL_WIDTH
    // Не уходим за левый край экрана
    if (adjustedLeft < 10) adjustedLeft = 10
  } else {
    adjustedLeft = left
    // Не уходим за правый край экрана
    if (adjustedLeft + MODAL_WIDTH > window.innerWidth) {
      adjustedLeft = window.innerWidth - MODAL_WIDTH - 10
    }
  }

  return { top: adjustedTop, left: adjustedLeft }
}

export const MessageModal = ({
  message,
  position,
  isGroup,
  onClose,
  handleReaction,
  handleDeleteMessage,
  handleShowEditMessage,
}: Props) => {
  const { top, left } = getModalPosition(position)

  return createPortal(
    <>
      <div className={style.messageModal__backdrop} onClick={onClose} />
      <div className={style.messageModal__container} style={{ top, left }}>
        <ModalCurrentMessage
          messageId={message._id}
          reactions={message.reactions}
          senderId={message.senderId._id}
          text={message?.text}
          editedAt={message?.editedAt}
          isGroup={isGroup}
          handleReaction={handleReaction}
          handleDeleteMessage={handleDeleteMessage}
          handleShowEditMessage={handleShowEditMessage}
        />
      </div>
    </>,
    document.body,
  )
}
