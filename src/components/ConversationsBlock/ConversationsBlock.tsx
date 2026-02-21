import { useEffect, useState } from "react"
import style from "./ConversationsBlock.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

import { RootState } from "@/store/store"

import { CloudinaryImage } from "@/components/CloudinaryImage/CloudinaryImage"
import { formatMessageTime } from "@/utils/formatMessageTime"
import SpinnerWindow from "@/components/ui/spinner/SpinnerWindow"
import ButtonMenu from "@/components/ui/button/Button"
import { ModalAddGroup } from "@/components/ModalAddGroup/ModalAddGroup"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Paginator } from "@/components/Paginator/Paginator"
import { fetchConversationsThunk } from "@/store/thunks/conversationsThunk"
import { clearMessages } from "@/store/slices/conversationsSlice"

export function ConversationsBlock() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlPage = Number(searchParams?.get("page")) || 1

  const [showAddGroup, setShowAddGroup] = useState(false)
  const dispatch = useAppDispatch()
  const conversations = useAppSelector(
    (state: RootState) => state.conversations.conversations
  )
  const pagination = useAppSelector(
    (state: RootState) => state.conversations.pagination
  )

  const loading = useAppSelector(
    (state: RootState) => state.conversations.loading
  )
  const userId = useAppSelector((state: RootState) => state.auth.userId)
  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)

  const handleLinkDialog = (conversationsId: string) => {
    router.push(`/conversation/${conversationsId}`)
  }

  useEffect(() => {
    dispatch(clearMessages())
    dispatch(fetchConversationsThunk({ page: urlPage }))
  }, [dispatch, urlPage])

  const closeModalAddGroup = () => {
    setShowAddGroup(false)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set("page", String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      {loading && <SpinnerWindow />}
      <div className={style.conversation}>
        {showAddGroup && (
          <ModalAddGroup closeModalAddGroup={closeModalAddGroup} />
        )}
        <div className={style.conversation__buttonBlock}>
          <ButtonMenu
            onClick={() => {
              setShowAddGroup(true)
            }}
          >
            Создать группу
          </ButtonMenu>
        </div>

        {pagination.pages > 1 && (
          <Paginator
            page={pagination.page}
            pages={pagination.pages}
            onPageChange={handlePageChange}
          />
        )}
        {conversations.length > 0 ? (
          <ul className={style.conversation__lists}>
            {conversations.map((conversation) => {
              // console.log("conversation****", conversation)
              if (conversation.type === "private") {
              }
              const member = conversation.members.filter(
                (member) => member.user._id !== userId
              )[0].user

              return (
                <li
                  key={conversation._id}
                  className={style.conversation__item}
                  onClick={() => {
                    handleLinkDialog(conversation._id)
                  }}
                >
                  <div className={style.conversation__containerImage}>
                    <div className={style.conversation__blockImage}>
                      <CloudinaryImage
                        src={member.avatar}
                        width={200}
                        height={200}
                        alt="userAvatar"
                      />
                    </div>
                    {usersOnline[member._id]?.isOnline && (
                      <div className={style.conversation__onlineBlock}></div>
                    )}
                  </div>
                  <div className={style.conversation__info}>
                    <div className={style.conversation__userName}>
                      {member.username}
                    </div>

                    {conversation?.lastMessageId && (
                      <div className={style.conversation__lastMessage}>
                        <div className={style.conversation__lastMessageContent}>
                          <div>
                            {conversation.lastMessageId.senderId.username}:
                          </div>
                          <div>{conversation.lastMessageId.text}</div>
                        </div>

                        <div className={style.conversation__timeBlock}>
                          {formatMessageTime(
                            conversation.lastMessageId.createdAt
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div>Диалогов пока нет</div>
        )}
      </div>
    </>
  )
}
