"use client"
import { REACTIONS } from "@/constants/reactions"
import style from "./ModalCurrentMessage.module.scss"
import { useState } from "react"
import { ReactionType } from "@/types/conversation.types"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
// import { formatMessageTime } from "@/utils/formatMessageTime"
// import { formatData } from "@/utils/formatData"
import { formatMessageDate } from "@/utils/formatReactionToMessage"
// import { MessageType } from '@/types/conversation.types'

export const ModalCurrentMessage = ({
  messageId,
  reactions,

  handleReaction,
}: {
  messageId: string
  reactions: ReactionType[]

  handleReaction: (messageId: string, reactionId: string) => void
}) => {
  const [showReaction, setShowReaction] = useState(false)
  const [showUserReaction, setShowUserReaction] = useState(false)

  const toggleShowReaction = () => {
    setShowReaction((prev) => !prev)
  }
  const toggleShowUserReaction = () => {
    setShowUserReaction((prev) => !prev)
    if (showReaction) {
      setShowReaction(false)
    }
  }

  return (
    <div className={style.modalCurrentMessage}>
      {!showUserReaction && (
        <ul>
          <li>
            <ul className={style.modalCurrentMessage__userReaction}>
              <div
                className={style.modalCurrentMessage__userReactionButton}
                onClick={toggleShowUserReaction}
              >
                <div>❤️{reactions.length} реакции</div>

                <ul>
                  {reactions.slice(0, 3).map((reaction) => (
                    <li key={reaction._id}>
                      <CloudinaryImage
                        src={reaction.user.avatar}
                        alt="avatar"
                        width={60}
                        height={60}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </ul>
          </li>
          <li>
            <span onClick={toggleShowReaction}>реакция</span>
            {showReaction && (
              <ul className={style.modalCurrentMessage__reactionWrapper}>
                {REACTIONS.map((item) => (
                  <li
                    key={item.id}
                    onClick={(e) => {
                      if (e) {
                        e.stopPropagation()
                      }
                      handleReaction(messageId, item.id)
                    }}
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
      )}

      {showUserReaction && (
        <div className={style.usersListReaction}>
          <button onClick={toggleShowUserReaction}>Назад</button>
          <ul className={style.usersListReaction__userReactionItems}>
            {reactions.map((reaction) => {
              const reactionItem = REACTIONS.find(
                (r) => r.id === reaction.emoji
              )
              if (!reactionItem) return
              return (
                <li
                  key={reaction._id}
                  // className={style.modalCurrentMessage__userReactionItem}
                >
                  <div className={style.usersListReaction__userInfoWrapper}>
                    <div className={style.usersListReaction__imageWrapperUser}>
                      <CloudinaryImage
                        src={reaction.user.avatar}
                        alt="avatar"
                        width={100}
                        height={100}
                      />
                    </div>
                    <div className={style.usersListReaction__userReactionInfo}>
                      <div
                        className={style.usersListReaction__userReactionName}
                      >
                        {reaction.user.username}
                      </div>
                      <div
                        className={style.usersListReaction__userReactionData}
                      >
                        {formatMessageDate(reaction.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className={style.usersListReaction__userReactionEmoji}>
                    {reactionItem.emoji}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
    // </div>
  )
}
