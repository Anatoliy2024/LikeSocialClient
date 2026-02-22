"use client"
// import { useGroupCallContext } from "@/app/GroupCallProvider"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import styles from "./StartGroupCallButton.module.scss"
import { useGroupCallContext } from "@/providers/GroupCallProvider"

const PhoneIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.61 5a2 2 0 0 1 1.95-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 10.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

interface Props {
  groupId: string
}

export const StartGroupCallButton = ({ groupId }: Props) => {
  const { joinCall } = useGroupCallContext()
  const status = useAppSelector((s: RootState) => s.groupCall.status)
  const currentGroupId = useAppSelector((s: RootState) => s.groupCall.groupId)

  const isInThisCall = status === "inCall" && currentGroupId === groupId
  const isInOtherCall = status === "inCall" && currentGroupId !== groupId

  const handleClick = () => {
    if (isInThisCall || isInOtherCall) return
    joinCall(groupId)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isInOtherCall}
      title={
        isInThisCall
          ? "Ты уже в беседе"
          : isInOtherCall
          ? "Ты уже в другой беседе"
          : "Начать голосовую беседу"
      }
      className={`${styles.btn} ${isInThisCall ? styles.active : ""} ${
        isInOtherCall ? styles.disabled : ""
      }`}
    >
      <PhoneIcon />
      {isInThisCall ? "В беседе" : "Беседа"}
    </button>
  )
}
