"use client"
import { REACTIONS } from "@/constants/reactions"
import style from "./ModalCurrentMessage.module.scss"
import { useState } from "react"
export const ModalCurrentMessage = ({
  messageId,
  handleReaction,
}: {
  messageId: string
  handleReaction: (messageId: string, reactionId: string) => void
}) => {
  const [showReaction, setShowReaction] = useState(false)

  const toggleShowReaction = () => {
    setShowReaction((prev) => !prev)
  }

  return (
    <div className={style.modalCurrentMessage}>
      <ul>
        <li>
          <span onClick={toggleShowReaction}>реакция</span>
          {showReaction && (
            <ul className={style.modalCurrentMessage__reactionWrapper}>
              {REACTIONS.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleReaction(messageId, item.id)}
                >
                  {item.emoji}
                </li>
              ))}
            </ul>
          )}
        </li>
        <li>ответить</li>
        <li>закрепить</li>
        <li>изменить</li>
        <li>удалить</li>
      </ul>
    </div>
    // </div>
  )
}
