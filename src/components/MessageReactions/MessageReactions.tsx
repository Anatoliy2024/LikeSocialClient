import { ReactionType } from "@/types/conversation.types"
import styles from "./MessageReactions.module.scss"
import { REACTIONS } from "@/constants/reactions"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"

type Props = {
  reactions: ReactionType[]
  messageId: string
  handleReaction: (messageId: string, reactionId: string) => void
}

const groupReactions = (reactions: ReactionType[]) => {
  const map = new Map<string, ReactionType[]>()

  reactions.forEach((r) => {
    if (!map.has(r.emoji)) map.set(r.emoji, [])
    map.get(r.emoji)!.push(r)
  })

  return Array.from(map.entries()).map(([emoji, users]) => ({ emoji, users }))
}

export const MessageReactions = ({
  reactions,
  messageId,
  handleReaction,
}: Props) => {
  if (!reactions?.length) return <div></div>
  console.log("MessageReactions reactions", reactions)
  const grouped = groupReactions(reactions)
  console.log("grouped*****", grouped)
  return (
    <div className={styles.reactions}>
      {grouped.map(({ emoji, users }) => {
        const reaction = REACTIONS.find((r) => r.id === emoji)
        if (!reaction) return null

        const visibleUsers = users.slice(0, 3)
        const extraCount = users.length - 3

        return (
          <div
            key={emoji}
            className={styles.reaction}
            title={users.map((u) => u.user.username).join(", ")}
            onClick={(e) => {
              e.stopPropagation()
              handleReaction(messageId, emoji)
            }}
          >
            <span>{reaction.emoji}</span>

            <div className={styles.avatars}>
              {visibleUsers.map((r) => (
                <CloudinaryImage
                  key={r.user._id}
                  src={r.user.avatar}
                  alt={r.user.username}
                  width={100}
                  height={100}
                  className={styles.avatar}
                />
              ))}
            </div>

            {extraCount > 0 && (
              <span className={styles.extra}>+{extraCount}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
