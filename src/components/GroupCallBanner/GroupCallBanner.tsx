"use client"
// import { useGroupCallContext } from "@/app/GroupCallProvider"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import styles from "./GroupCallBanner.module.scss"
import { useGroupCallContext } from "@/providers/GroupCallProvider"
// import { useEffect, useRef } from "react"

interface Props {
  groupId: string
}

export const GroupCallBanner = ({ groupId }: Props) => {
  const status = useAppSelector((s: RootState) => s.groupCall.status)
  const currentGroupId = useAppSelector((s: RootState) => s.groupCall.groupId)
  // const activeGroupCalls = useAppSelector(
  //   (s: RootState) => s.groupCall.activeGroupCalls
  // )
  const externalCount = useAppSelector(
    (s: RootState) => s.groupCall.activeGroupCalls[groupId]
  )

  const participants = useAppSelector(
    (s: RootState) => s.groupCall.participants
  )
  // console.log("externalCount", externalCount)
  // console.log("participants", participants)
  // console.log("GroupCallBanner ререндер")
  // console.log("groupId", groupId)
  // console.log("currentGroupId", currentGroupId)
  // console.log("externalCount", externalCount)

  const { joinCall, leaveCall } = useGroupCallContext()

  const isMyCall = status === "inCall" && currentGroupId === groupId
  // const externalCount = activeGroupCalls[groupId]

  // Показываем баннер если я в беседе ИЛИ кто-то другой начал беседу в этой группе
  if (!isMyCall && externalCount === undefined) return null

  const participantsCount = isMyCall ? participants.length + 1 : externalCount
  return (
    <div className={styles.banner}>
      <div className={styles.left}>
        <span className={styles.dot} />
        <span className={styles.text}>Voice</span>
        <span className={styles.count}>· {participantsCount} member</span>
      </div>
      <div className={styles.right}>
        {isMyCall ? (
          <button className={styles.btnLeave} onClick={leaveCall}>
            leave
          </button>
        ) : (
          <button className={styles.btnJoin} onClick={() => joinCall(groupId)}>
            join
          </button>
        )}
      </div>
    </div>
  )
}
