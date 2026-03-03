"use client"
import { REACTIONS } from "@/constants/reactions"
import style from "./ModalCurrentMessage.module.scss"
import { useEffect, useState } from "react"
import {
  MemberType,
  // messageViewersUserType,
  ReactionType,
} from "@/types/conversation.types"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
// import { formatMessageTime } from "@/utils/formatMessageTime"
// import { formatData } from "@/utils/formatData"
import { formatMessageDate } from "@/utils/formatReactionToMessage"
import { getMessageViewersThunk } from "@/store/thunks/conversationsThunk"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { clearMessageViewers } from "@/store/slices/conversationsSlice"
import { RootState } from "@/store/store"
// import { MessageType } from '@/types/conversation.types'

export const ModalCurrentMessage = ({
  messageId,
  reactions,
  senderId,
  handleReaction,
  handleDeleteMessage,
  handleShowEditMessage,
  text,
}: {
  messageId: string
  reactions: ReactionType[]
  senderId: string
  handleReaction: (messageId: string, reactionId: string) => void
  handleDeleteMessage: (messageId: string) => void
  handleShowEditMessage: (messageId: string, text?: string) => void
  text?: string
}) => {
  const [showReaction, setShowReaction] = useState(false)
  const [showUserReaction, setShowUserReaction] = useState(false)
  const dispatch = useAppDispatch()
  const users = useAppSelector(
    (state: RootState) => state.conversations.messageViewers.users
  )
  const owner = useAppSelector(
    (state: RootState) => state.conversations.currentConversation?.owner
  )
  const userId = useAppSelector((state: RootState) => state.auth.userId)

  const toggleShowReaction = () => {
    setShowReaction((prev) => !prev)
  }
  const toggleShowUserReaction = () => {
    setShowUserReaction((prev) => !prev)
    if (showReaction) {
      setShowReaction(false)
    }
  }

  useEffect(() => {
    dispatch(getMessageViewersThunk(messageId))

    return () => {
      dispatch(clearMessageViewers())
    }
  }, [dispatch, messageId])
  // console.log("users", users)

  // const modifiedUser= {

  // }

  const normalizedUsers = users.map((e) => ({
    _id: e._id,
    user: e.userId,
    date: e.readAt,
    emoji: "",
  }))

  const normalizedReactions = reactions.map((e) => ({
    _id: e._id,
    user: e.user,
    date: e.createdAt,
    emoji: e.emoji,
  }))

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
                <div
                  className={style.modalCurrentMessage__userReactionButtonInfo}
                >
                  <span>❤️</span>
                  {reactions.length > 0 && <span>{reactions.length}</span>}
                  <span>реакции</span>
                </div>

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
          {/* <li>ответить</li> */}
          {/* <li>закрепить</li> */}
          {userId === senderId && (
            <li onClick={() => handleShowEditMessage(messageId, text)}>
              изменить
            </li>
          )}
          {(userId === owner || userId === senderId) && (
            <li onClick={() => handleDeleteMessage(messageId)}>удалить</li>
          )}
        </ul>
      )}

      {showUserReaction && (
        <div className={style.usersListReaction}>
          <button onClick={toggleShowUserReaction}>Назад</button>
          <UserList events={normalizedReactions} />
          <UserList events={normalizedUsers} />
        </div>
      )}
    </div>
    // </div>
  )
}

type NormalizedUserEvent = {
  _id: string
  user: MemberType
  date: string
  emoji: string
}

const UserList = ({ events }: { events: NormalizedUserEvent[] }) => {
  return (
    <ul className={style.usersListReaction__userReactionItems}>
      {events.map((event) => {
        const reactionItem = REACTIONS.find((r) => r.id === event.emoji)

        return (
          <li key={event._id}>
            <div className={style.usersListReaction__userInfoWrapper}>
              <div className={style.usersListReaction__imageWrapperUser}>
                <CloudinaryImage
                  src={event.user.avatar}
                  alt="avatar"
                  width={120}
                  height={120}
                />
              </div>
              <div className={style.usersListReaction__userReactionInfo}>
                <div className={style.usersListReaction__userReactionName}>
                  {event.user.username}
                </div>
                <div className={style.usersListReaction__userReactionData}>
                  {formatMessageDate(event.date)}
                </div>
              </div>
            </div>

            <div className={style.usersListReaction__userReactionEmoji}>
              {reactionItem?.emoji ?? "✓✓"}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
