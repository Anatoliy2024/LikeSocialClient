import Link from "next/link"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import { ProfileLink } from "../ProfileLink/ProfileLink"
import { GroupCallBanner } from "../GroupCallBanner/GroupCallBanner"
import { OptionIcon } from "@/assets/icons/optionIcon"
import { TrashThree } from "@/assets/icons/trashThree"
import { Clear } from "@/assets/icons/clear"
import { StartGroupCallButton } from "../StartGroupCallButton/StartGroupCallButton"
import { Dispatch, memo, RefObject, SetStateAction } from "react"
import style from "./MessageBlockHeader.module.scss"
import { ArrowBack } from "@/assets/icons/arrowBack"
import { formatData } from "@/utils/formatData"
import { ConversationType } from "@/types/conversation.types"
import { BaseMember } from "@/types/base"
import {
  OnlineStatus,
  OnlineStatusState,
} from "@/store/slices/onlineStatusSlice"
import { ConfirmConfigType } from "@/types/useMessageBlock.types"

const MessageBlockHeaderComponent = ({
  isGroup,
  id,
  currentConversation,
  recipientId,
  userId,
  usersOnline,
  status,
  optionRef,
  setShowOption,
  showOption,
  isOwner,
  delConversation,
  delHistoryMessages,
  setConfirmConfig,
}: {
  isGroup: boolean
  id: string
  currentConversation: ConversationType
  recipientId: BaseMember | undefined
  userId: string | null
  usersOnline: OnlineStatusState
  status: OnlineStatus
  optionRef: RefObject<HTMLDivElement | null>
  setShowOption: Dispatch<SetStateAction<boolean>>
  showOption: boolean
  isOwner: boolean
  delConversation: () => void
  delHistoryMessages: () => void
  setConfirmConfig: Dispatch<SetStateAction<ConfirmConfigType>>
}) => {
  //   console.log("MessageBlockHeaderComponent render")
  return (
    <div className={style.messageBlockHeader__userInfo}>
      <div className={style.messageBlockHeader__userInfoContainer}>
        <Link
          href="/conversations/"
          className={style.messageBlockHeader__buttonBackBlock}
        >
          <ArrowBack />
        </Link>
        {isGroup && (
          <Link
            href={`/conversation/${id}/settings`}
            className={style.messageBlockHeader__groupInfo}
          >
            {currentConversation.avatar && (
              <div className={style.messageBlockHeader__blockImg}>
                <CloudinaryImage
                  src={currentConversation.avatar}
                  alt="avatar"
                  width={200}
                  height={200}
                />
              </div>
            )}
            <div className={style.messageBlockHeader__groupInfoMain}>
              <div className={style.messageBlockHeader__groupInfoTitle}>
                {currentConversation.title}
              </div>
              <div className={style.messageBlockHeader__groupInfoMemberCount}>
                {currentConversation.members.length} участника(ов)
              </div>
            </div>
          </Link>
        )}
        {currentConversation?.type === "private" && recipientId && (
          <>
            <ProfileLink userId={recipientId._id} currentUserId={userId}>
              <div className={style.messageBlockHeader__userImgOnlineBlock}>
                <div className={style.messageBlockHeader__blockImg}>
                  <CloudinaryImage
                    src={recipientId.avatar}
                    alt="avatar"
                    width={200}
                    height={200}
                  />
                </div>
                {usersOnline[recipientId._id]?.isOnline && (
                  <div className={style.messageBlockHeader__onlineBlock} />
                )}
              </div>
            </ProfileLink>
            <div>
              <div>{recipientId.username}</div>
              {!status.isOnline && status.lastSeen && (
                <div className={style.messageBlockHeader__lastSeen}>
                  <span>был(а):</span>{" "}
                  <span>{formatData(status.lastSeen)}</span>
                </div>
              )}
            </div>
          </>
        )}
        <GroupCallBanner groupId={currentConversation._id} />
      </div>

      <div
        className={style.messageBlockHeader__optionConversation}
        ref={optionRef}
      >
        <button
          onClick={() => setShowOption((prev) => !prev)}
          className={`${style.messageBlockHeader__ButtonOption} ${
            showOption ? style.messageBlockHeader__ButtonOptionShow : ""
          }`}
        >
          <OptionIcon />
        </button>
        {showOption && (
          <ul>
            {(isOwner || !isGroup) && (
              <>
                <li
                  onClick={() =>
                    setConfirmConfig({
                      title: `Удалить ${isGroup ? "группу" : "беседу"}`,
                      message: "Вы уверены? Это действие нельзя отменить.",
                      onConfirm: delConversation,
                    })
                  }
                >
                  <TrashThree />
                  <span>Удалить {isGroup ? "группу" : "беседу"}</span>
                </li>
                <li
                  onClick={() =>
                    setConfirmConfig({
                      title: "Очистить историю",
                      message:
                        "Вы уверены? История будет удалена безвозвратно.",
                      onConfirm: delHistoryMessages,
                    })
                  }
                >
                  <Clear /> <span>Очистить историю</span>
                </li>
              </>
            )}
            {isGroup && (
              <li>
                <StartGroupCallButton groupId={currentConversation._id} />
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

export const MessageBlockHeader = memo(MessageBlockHeaderComponent)
