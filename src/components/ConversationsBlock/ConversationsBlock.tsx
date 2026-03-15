import { useEffect, useState } from "react"
import style from "./ConversationsBlock.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { CloudinaryImage } from "@/components/CloudinaryImage/CloudinaryImage"
import { formatMessageTime } from "@/utils/formatMessageTime"
import SpinnerWindow from "@/components/ui/spinner/SpinnerWindow"
import ButtonMenu from "@/components/ui/button/Button"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Paginator } from "@/components/Paginator/Paginator"
import { fetchConversationsThunk } from "@/store/thunks/conversationsThunk"
import {
  addMessageInConversationPage,
  clearMessages,
} from "@/store/slices/conversationsSlice"
import { ModalCreateGroup } from "../ModalAddGroup/ModalCreateGroup"
import { useSocket } from "@/providers/SocketProvider"
import { MessageType } from "@/types/conversation.types"
import { getMessagePreview } from "@/utils/getMessagePreview"

export function ConversationsBlock() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlPage = Number(searchParams?.get("page")) || 1
  const socket = useSocket()
  const [showAddGroup, setShowAddGroup] = useState(false)
  const dispatch = useAppDispatch()
  const conversations = useAppSelector(
    (state: RootState) => state.conversations.conversations,
  )

  const pagination = useAppSelector(
    (state: RootState) => state.conversations.pagination,
  )

  const loading = useAppSelector(
    (state: RootState) => state.conversations.loading,
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

  useEffect(() => {
    if (!socket || !userId) return

    const handleNewMessage = (data: { message: MessageType }) => {
      const messageData = data.message
      dispatch(addMessageInConversationPage({ message: messageData, userId }))
    }

    socket.on("message:new", handleNewMessage)

    return () => {
      socket.off("message:new", handleNewMessage)
    }
  }, [socket, userId, dispatch])

  console.log("render ConversationsBlock")
  return (
    <>
      {loading && <SpinnerWindow />}
      <div className={style.conversation}>
        {showAddGroup && (
          <ModalCreateGroup closeModalAddGroup={closeModalAddGroup} />
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
              const isGroup = conversation.type === "group"
              const unreadCount = conversation.members.find(
                (member) => member.user._id === userId,
              )?.unreadCount
              const member = conversation.members.filter(
                (member) => member.user._id !== userId,
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
                        src={isGroup ? conversation.avatar : member.avatar}
                        width={200}
                        height={200}
                        alt="userAvatar"
                      />
                    </div>
                    {!isGroup && usersOnline[member._id]?.isOnline && (
                      <div className={style.conversation__onlineBlock}></div>
                    )}
                  </div>
                  <div className={style.conversation__info}>
                    <div className={style.conversation__firstCol}>
                      {!isGroup && (
                        <div className={style.conversation__userName}>
                          {member.username}
                        </div>
                      )}
                      {isGroup && (
                        <div className={style.conversation__userName}>
                          {conversation.title}
                        </div>
                      )}
                      {conversation?.lastMessageId && (
                        <div className={style.conversation__lastMessage}>
                          <div
                            className={style.conversation__lastMessageContent}
                          >
                            <div>
                              {conversation.lastMessageId.senderId.username}:
                            </div>
                            {/* {type==="text" &&}
                            {type!==="text" &&getMessagePreview(type)} */}
                            <div>
                              {conversation.lastMessageId.type === "text"
                                ? conversation.lastMessageId.text
                                : getMessagePreview(
                                    conversation.lastMessageId.type,
                                  )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {conversation?.lastMessageId && (
                      <div className={style.conversation__secondCol}>
                        <div className={style.conversation__timeBlock}>
                          {formatMessageTime(
                            conversation.lastMessageId.createdAt,
                          )}
                        </div>
                        {!!unreadCount && unreadCount > 0 && (
                          <div className={style.conversation__newMessage}>
                            {unreadCount}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div>Чатов пока нет</div>
        )}
      </div>
    </>
  )
}
