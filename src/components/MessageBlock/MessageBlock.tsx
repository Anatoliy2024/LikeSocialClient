"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import {
  delConversationThunk,
  delHistoryMessagesThunk,
  fetchMessagesThunk,
} from "@/store/thunks/conversationsThunk"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import style from "./MessageBlock.module.scss"
import { getSocket } from "@/lib/socket"
import {
  addMessageFromSocket,
  incrementPage,
  clearMessages,
} from "@/store/slices/conversationsSlice"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import { ProfileLink } from "../ProfileLink/ProfileLink"
import Spinner from "../ui/spinner/Spinner"
import Link from "next/link"
import { formatMessageTime } from "@/utils/formatMessageTime"
import { ArrowBack } from "@/assets/icons/arrowBack"
import { SendMessage } from "@/assets/icons/sendMessage"
import { useHideOnScroll } from "@/hooks/useHideOnScroll"
import { formatData } from "@/utils/formatData"

import { TrashThree } from "@/assets/icons/trashThree"
import { Clear } from "@/assets/icons/clear"
import { OptionIcon } from "@/assets/icons/optionIcon"
import { MessageType } from "@/types/conversation.types"
import { StartGroupCallButton } from "../StartGroupCallButton/StartGroupCallButton"
import { GroupCallBanner } from "../GroupCallBanner/GroupCallBanner"
import ConfirmModal from "../ConfirmModal/ConfirmModal"

export const MessageBlock = () => {
  const router = useRouter()
  const [textMessage, setTextMessage] = useState("")
  const [showOption, setShowOption] = useState(false)

  const [confirmConfig, setConfirmConfig] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const openConfirm = (config: typeof confirmConfig) => setConfirmConfig(config)
  const closeConfirm = () => setConfirmConfig(null)

  const optionRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  // Защита от двойного монтирования в React StrictMode
  const initializedIdRef = useRef<string | null>(null)
  // Блокировка повторного incrementPage пока идёт загрузка
  const isLoadingMoreRef = useRef(false)

  const socket = getSocket()
  const dispatch = useAppDispatch()

  const {
    messages,
    currentConversation,
    loading,
    pagination: { hasMore, hasLoaded, page },
  } = useAppSelector((state) => state.conversations)

  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)
  const userId = useAppSelector((state) => state.auth.userId)
  const optionHeaderMessage = useHideOnScroll()

  const params = useParams<{ id: string }>()
  if (!params || !params.id) throw new Error("Параметр id не найден")
  const id = params.id

  const recipientId = currentConversation?.members.find(
    (member) => member.user._id !== userId
  )?.user

  const isGroup = currentConversation?.type === "group"

  const status = usersOnline[recipientId?._id as string] ?? {
    isOnline: false,
    lastSeen: null,
  }

  // ───────────────────────────────────────────────
  // Эффект 1: инициализация беседы (первая страница)
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    if (initializedIdRef.current === id) return

    initializedIdRef.current = id
    isLoadingMoreRef.current = false

    dispatch(clearMessages())
    dispatch(fetchMessagesThunk({ conversationId: id, page: 1 }))

    return () => {
      initializedIdRef.current = null
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ───────────────────────────────────────────────
  // Эффект 2: подключение сокета
  // Намеренно без зависимостей — сокет живёт на всё время монтирования.
  // Если роутинг размонтирует компонент при смене беседы — этого достаточно.
  // ───────────────────────────────────────────────
  useEffect(() => {
    const messageHandler = (data: { message: MessageType }) => {
      dispatch(addMessageFromSocket(data.message))
    }

    socket.emit("conversation:join", id)
    socket.on("message:new", messageHandler)

    return () => {
      socket.emit("conversation:leave", id)
      socket.off("message:new", messageHandler)
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ───────────────────────────────────────────────
  // Эффект 3: подгрузка следующих страниц
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (!id || page === 1 || !hasLoaded) return
    if (currentConversation?._id !== id) return

    dispatch(fetchMessagesThunk({ conversationId: id, page }))
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  // ───────────────────────────────────────────────
  // Сброс флага блокировки когда загрузка завершилась
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (!loading) {
      isLoadingMoreRef.current = false
    }
  }, [loading])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionRef.current && !optionRef.current.contains(e.target as Node)) {
        setShowOption(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ───────────────────────────────────────────────
  // IntersectionObserver для пагинации
  // ───────────────────────────────────────────────
  const lastMessageRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }

      if (!node || loading || !hasLoaded || !hasMore) return

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return
          if (!hasMore) return
          if (isLoadingMoreRef.current) return

          isLoadingMoreRef.current = true
          dispatch(incrementPage())
        },
        { threshold: 0.5 }
      )

      observerRef.current.observe(node)
    },
    [loading, hasMore, hasLoaded, dispatch]
  )

  if (!currentConversation && loading) {
    return (
      <div style={{ paddingTop: "50px" }}>
        <Spinner />
      </div>
    )
  }

  if (!currentConversation) return <div>Беседа не найдена</div>

  const handleSendMessage = async () => {
    if (!textMessage.trim()) return
    try {
      socket.emit("message:send", {
        conversationId: id,
        type: "text",
        text: textMessage,
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
      setTextMessage("")
    } catch (error) {
      console.log(error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const delConversation = async () => {
    try {
      await dispatch(delConversationThunk(currentConversation._id))
      router.push(`/conversations/`)
    } catch (error) {
      console.log(error)
    }
  }

  const delHistoryMessages = () => {
    dispatch(delHistoryMessagesThunk(currentConversation._id))
  }

  const handleShowOption = () => {
    setShowOption((prev) => !prev)
  }

  return (
    <div className={style.messageBlock}>
      <ConfirmModal
        isOpen={!!confirmConfig}
        onCancel={closeConfirm}
        onConfirm={() => {
          confirmConfig?.onConfirm()
          closeConfirm()
        }}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
      />
      <div
        className={`${style.messageBlock__userInfo} ${
          !optionHeaderMessage ? style.messageBlock__moveHeaderMessage : ""
        }`}
      >
        <div className={style.messageBlock__userInfoContainer}>
          <Link
            href={"/conversations/"}
            className={style.messageBlock__buttonBackBlock}
          >
            <ArrowBack />
          </Link>

          {isGroup && (
            <div className={style.messageBlock__groupInfo}>
              <div className={style.messageBlock__blockImg}>
                <CloudinaryImage
                  src={currentConversation.avatar || ""}
                  alt="avatar"
                  width={200}
                  height={200}
                />
              </div>
              <div className={style.messageBlock__groupInfoMain}>
                <div className={style.messageBlock__groupInfoTitle}>
                  {currentConversation.title}
                </div>
                <div className={style.messageBlock__groupInfoMemberCount}>
                  {currentConversation.members.length} участника(ов)
                </div>
              </div>
            </div>
          )}

          {currentConversation?.type === "private" && recipientId && (
            <>
              <ProfileLink userId={recipientId._id} currentUserId={userId}>
                <div className={style.messageBlock__userImgOnlineBlock}>
                  <div className={style.messageBlock__blockImg}>
                    <CloudinaryImage
                      src={recipientId.avatar}
                      alt="avatar"
                      width={200}
                      height={200}
                    />
                  </div>
                  {usersOnline[recipientId._id]?.isOnline && (
                    <div className={style.messageBlock__onlineBlock}></div>
                  )}
                </div>
              </ProfileLink>
              <div>
                <div>{recipientId.username}</div>
                {!status.isOnline && status.lastSeen && (
                  <div className={style.messageBlock__lastSeen}>
                    <span>был(а):</span>{" "}
                    <span>{formatData(status.lastSeen)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <GroupCallBanner groupId={currentConversation._id} />
        </div>

        <div className={style.messageBlock__optionConversation} ref={optionRef}>
          <button
            onClick={handleShowOption}
            className={`${style.messageBlock__ButtonOption} ${
              showOption ? style.messageBlock__ButtonOptionShow : ""
            }`}
          >
            <OptionIcon />
          </button>
          {showOption && (
            <ul>
              <li
                onClick={() =>
                  openConfirm({
                    title: `Удалить ${isGroup ? "группу" : "беседу"}`,
                    message: "Вы уверены? Это действие нельзя отменить.",
                    onConfirm: delConversation,
                  })
                }
                // onClick={delConversation}
                // title={`Удалить ${isGroup ? "группу" : "беседу"}`}
              >
                <TrashThree />{" "}
                <span>Удалить {isGroup ? "группу" : "беседу"}</span>
              </li>
              <li
                onClick={() =>
                  openConfirm({
                    title: "Очистить историю",
                    message: "Вы уверены? История будет удалена безвозвратно.",
                    onConfirm: delHistoryMessages,
                  })
                }
                //  onClick={delHistoryMessages}
                // title="Очистить историю"
              >
                <Clear /> <span>Очистить историю</span>
              </li>

              {isGroup && (
                <li>
                  <StartGroupCallButton groupId={currentConversation._id} />
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <div
        className={`${style.messageBlock__newMessageBlock} ${
          !optionHeaderMessage ? style.messageBlock__moveHeaderMessage : ""
        }`}
      >
        <div className={style.messageBlock__newMessageBlockInput}>
          <input
            type="text"
            placeholder="Сообщение"
            onChange={(e) => setTextMessage(e.target.value)}
            value={textMessage}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div
          onClick={handleSendMessage}
          title="Отправить сообщение"
          className={style.messageBlock__newMessageButtonBlock}
        >
          <SendMessage />
        </div>
      </div>

      <div className={style.messageBlock__contentMessageBlock}>
        {messages.length > 0 && (
          <div className={style.messageBlock__messagesList}>
            {messages.map((message, i) => {
              const isLast = i === messages.length - 1
              return (
                <div
                  key={message._id}
                  className={style.messageBlock__messageListWrapper}
                  // className={`${style.messageBlock__messageList} ${
                  //   message.senderId._id !== userId
                  //     ? style.messageBlock__recipient
                  //     : style.messageBlock__me
                  // }
                  // `}
                  ref={isLast ? lastMessageRef : null}
                >
                  {isGroup && message.senderId._id !== userId && (
                    // <div className={style.messageBlock__senderImage}>
                    <div className={style.messageBlock__senderImage}>
                      <CloudinaryImage
                        src={message.senderId.avatar}
                        alt="avatar"
                        width={200}
                        height={200}
                      />
                    </div>

                    // </div>
                  )}
                  <div
                    className={`${style.messageBlock__messageList} ${
                      message.senderId._id !== userId
                        ? style.messageBlock__recipient
                        : style.messageBlock__me
                    }`}
                  >
                    <div>{message.text}</div>
                    <div>{formatMessageTime(message.createdAt)}</div>
                  </div>
                </div>
              )
            })}
            {loading && <Spinner />}
          </div>
        )}
      </div>
    </div>
  )
}

//************************первый вариант с беседами***********************************
// "use client"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { RootState } from "@/store/store"
// import {
//   delConversationThunk,
//   delHistoryMessagesThunk,
//   fetchMessagesThunk,
// } from "@/store/thunks/conversationsThunk"
// import { useParams } from "next/navigation"
// import { useCallback, useEffect, useRef, useState } from "react"
// import style from "./MessageBlock.module.scss"
// import { getSocket } from "@/lib/socket"
// import {
//   addMessageFromSocket,
//   incrementPage,
//   clearMessages,
//   MessageType,
// } from "@/store/slices/conversationsSlice"
// import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
// import { ProfileLink } from "../ProfileLink/ProfileLink"
// import Spinner from "../ui/spinner/Spinner"
// import Link from "next/link"
// import { formatMessageTime } from "@/utils/formatMessageTime"
// import { ArrowBack } from "@/assets/icons/arrowBack"
// import { SendMessage } from "@/assets/icons/sendMessage"
// import { useHideOnScroll } from "@/hooks/useHideOnScroll"
// import { formatData } from "@/utils/formatData"

// export const MessageBlock = () => {
//   const [textMessage, setTextMessage] = useState("")
//   const observerRef = useRef<IntersectionObserver | null>(null)
//   const joinedRef = useRef(false)
//   const socket = getSocket()
//   const dispatch = useAppDispatch()

//   const {
//     messages,
//     currentConversation,
//     loading,
//     pagination: { hasMore, hasLoaded, page },
//   } = useAppSelector((state) => state.conversations)

//   const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)
//   const userId = useAppSelector((state) => state.auth.userId)

//   // Для личного чата — ищем собеседника
//   // Для группы — recipientId будет undefined, это нормально
//   const recipientId = currentConversation?.members.find(
//     (member) => member.user._id !== userId
//   )?.user
//   console.log("recipientId***", recipientId)

//   const isGroup = currentConversation?.type === "group"

//   const status = usersOnline[recipientId?._id as string] ?? {
//     isOnline: false,
//     lastSeen: null,
//   }

//   const params = useParams<{ id: string }>()
//   console.log("params", params)
//   if (!params || !params.id) throw new Error("Параметр id не найден")
//   const id = params.id

//   // Первый заход в беседу
//   useEffect(() => {
//     if (!id || joinedRef.current) return

//     const messageHandler = (data: { message: MessageType }) => {
//       dispatch(addMessageFromSocket(data.message))
//     }

//     dispatch(clearMessages())
//     // console.log("Запуск fetchMessagesThunk", id)
//     // if (!hasLoaded) {
//     dispatch(fetchMessagesThunk({ conversationId: id, page: 1 }))
//     // }
//     // dispatch(fetchMessagesThunk({ conversationId: id, page: 1 }))

//     socket.emit("conversation:join", id)
//     socket.on("message:new", messageHandler)

//     joinedRef.current = true

//     return () => {
//       socket.emit("conversation:leave", id)
//       socket.off("message:new", messageHandler)
//       joinedRef.current = false
//     }
//   }, [id, dispatch, socket])

//   // Подгрузка следующих страниц
//   useEffect(() => {
//     if (!id || currentConversation?._id !== id || page === 1) return
//     dispatch(fetchMessagesThunk({ conversationId: id, page }))
//   }, [dispatch, page, id, currentConversation?._id])

//   // IntersectionObserver для пагинации (последнее сообщение в списке = самое старое)
//   const lastMessageRef = useCallback(
//     (node: HTMLDivElement | null) => {
//       if (loading || !hasLoaded) return
//       if (observerRef.current) observerRef.current.disconnect()

//       observerRef.current = new IntersectionObserver(
//         (entries) => {
//           if (entries[0].isIntersecting && hasMore) {
//             dispatch(incrementPage())
//           }
//         },
//         { threshold: 1 }
//       )

//       if (node) observerRef.current.observe(node)
//     },
//     [loading, hasMore, dispatch, hasLoaded]
//   )

//   const optionHeaderMessage = useHideOnScroll()

//   // Загрузка
//   if (!currentConversation && loading) {
//     return (
//       <div style={{ paddingTop: "50px" }}>
//         <Spinner />
//       </div>
//     )
//   }

//   // Беседа не найдена
//   if (!currentConversation) return <div>Беседа не найдена</div>

//   const handleSendMessage = async () => {
//     if (!textMessage.trim()) return
//     try {
//       socket.emit("message:send", {
//         conversationId: id,
//         type: "text",
//         text: textMessage,
//       })

//       window.scrollTo({ top: 0, behavior: "smooth" })
//       setTextMessage("")
//     } catch (error) {
//       console.log(error)
//     }
//   }

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter") {
//       e.preventDefault()
//       handleSendMessage()
//     }
//   }
//   const delConversation = () => {
//     dispatch(delConversationThunk(currentConversation._id))
//   }
//   const delHistoryMessages = () => {
//     dispatch(delHistoryMessagesThunk(currentConversation._id))
//   }

//   return (
//     <>
//       <div className={style.messageBlock}>
//         <div
//           className={`${style.messageBlock__userInfo} ${
//             !optionHeaderMessage ? style.messageBlock__moveHeaderMessage : ""
//           }`}
//         >
//           <Link
//             href={"/conversations/"}
//             className={style.messageBlock__buttonBackBlock}
//           >
//             <ArrowBack />
//           </Link>

//           {/* Шапка: для группы показываем название группы, для личного — профиль собеседника */}
//           {isGroup && (
//             <div className={style.messageBlock__userImgOnlineBlock}>
//               <div className={style.messageBlock__blockImg}>
//                 <CloudinaryImage
//                   src={currentConversation.avatar || ""}
//                   alt="avatar"
//                   width={200}
//                   height={200}
//                 />
//               </div>
//               <div>{currentConversation.name || "Группа"}</div>
//             </div>
//           )}

//           {currentConversation?.type === "private" && recipientId && (
//             <>
//               <ProfileLink userId={recipientId._id} currentUserId={userId}>
//                 <div className={style.messageBlock__userImgOnlineBlock}>
//                   <div className={style.messageBlock__blockImg}>
//                     <CloudinaryImage
//                       src={recipientId.avatar}
//                       alt="avatar"
//                       width={200}
//                       height={200}
//                     />
//                   </div>
//                   {usersOnline[recipientId._id]?.isOnline && (
//                     <div className={style.messageBlock__onlineBlock}></div>
//                   )}
//                 </div>
//               </ProfileLink>
//               <div>
//                 <div>{recipientId.username}</div>
//                 {!status.isOnline && status.lastSeen && (
//                   <div className={style.messageBlock__lastSeen}>
//                     <span>был(а):</span>{" "}
//                     <span>{formatData(status.lastSeen)}</span>
//                   </div>
//                 )}
//               </div>
//             </>
//           )}
//           <div className={style.messageBlock__optionConversation}>
//             <button>настройки</button>
//             <ul>
//               <li onClick={delConversation}>
//                 Удалить {isGroup ? "группу" : "беседу"}
//               </li>
//               <li onClick={delHistoryMessages}>Очистить историю</li>
//             </ul>
//           </div>
//         </div>

//         <div className={style.messageBlock__contentMessageBlock}>
//           {messages.length > 0 && (
//             <div className={style.messageBlock__messagesList}>
//               {messages.map((message, i) => {
//                 const isLast = i === messages.length - 1
//                 console.log("message._id", message._id)
//                 return (
//                   <div
//                     key={message._id}
//                     className={`${style.messageBlock__messageList} ${
//                       message.senderId._id !== userId
//                         ? style.messageBlock__recipient
//                         : style.messageBlock__me
//                     }`}
//                     ref={isLast ? lastMessageRef : null}
//                   >
//                     {/* В группе показываем имя отправителя */}
//                     {isGroup && message.senderId._id !== userId && (
//                       <div className={style.messageBlock__senderName}>
//                         {message.senderId.username}
//                       </div>
//                     )}
//                     <div>{message.text}</div>
//                     <div>{formatMessageTime(message.createdAt)}</div>
//                   </div>
//                 )
//               })}
//               {loading && <Spinner />}
//             </div>
//           )}
//         </div>

//         <div
//           className={`${style.messageBlock__newMessageBlock} ${
//             !optionHeaderMessage ? style.messageBlock__moveHeaderMessage : ""
//           }`}
//         >
//           <div className={style.messageBlock__newMessageBlockInput}>
//             <input
//               type="text"
//               placeholder="Сообщение"
//               onChange={(e) => setTextMessage(e.target.value)}
//               value={textMessage}
//               onKeyDown={handleKeyDown}
//             />
//           </div>
//           <div
//             onClick={handleSendMessage}
//             title="Отправить сообщение"
//             className={style.messageBlock__newMessageButtonBlock}
//           >
//             <SendMessage />
//           </div>
//         </div>
//       </div>
//     </>
//   )
// }

//*****************************первонаяальный вариант Dialogs************************
// "use client"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { RootState } from "@/store/store"
// import { getUserMessagesThunk } from "@/store/thunks/dialogsThunk"

// import { useParams } from "next/navigation"
// import { useCallback, useEffect, useRef, useState } from "react"
// import style from "./MessageBlock.module.scss"
// import { getSocket } from "@/lib/socket"
// import {
//   addMessageFromSocket,
//   changeCurrantPage,
//   clearMessages,
//   MessageType,
// } from "@/store/slices/dialogsSlice"

// import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"

// import { ProfileLink } from "../ProfileLink/ProfileLink"
// import Spinner from "../ui/spinner/Spinner"
// import Link from "next/link"
// // import { useHideOnScroll } from "@/hooks/useHideOnScroll"
// import { formatMessageTime } from "@/utils/formatMessageTime"
// import { ArrowBack } from "@/assets/icons/arrowBack"
// import { SendMessage } from "@/assets/icons/sendMessage"
// import { useHideOnScroll } from "@/hooks/useHideOnScroll"
// import { formatData } from "@/utils/formatData"
// // import SpinnerWindow from "../ui/spinner/SpinnerWindow"

// export const MessageBlock = () => {
//   const [textMessage, setTextMessage] = useState("")

//   const observerRef = useRef<IntersectionObserver | null>(null)
//   const joinedRef = useRef(false)
//   // const hasLoadedRef = useRef(false)
//   const socket = getSocket()
//   const dispatch = useAppDispatch()

//   const {
//     messages,
//     hasMore,
//     currentPage,
//     currentDialog,
//     loading,
//     hasLoaded,
//     isOnline,
//     lastSeen,
//   } = useAppSelector((state) => state.dialogs)
//   const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)
//   const userId = useAppSelector((state) => state.auth.userId)
//   const recipientId = currentDialog?.members.find(
//     (member) => member._id !== userId
//   )

//   const status = usersOnline[recipientId?._id as string] ?? {
//     isOnline,
//     lastSeen,
//   }

//   // useEffect(() => {
//   //   dispatch(clearMessages())
//   // }, [dispatch])
//   // const lastSeen = status.isOnline ? null : status.lastSeen ?? lastSeen

//   // const { id } = useParams<{ id: string }>()

//   const params = useParams<{ id: string }>()

//   if (!params || !params.id) {
//     // можно показать заглушку, редирект или бросить ошибку
//     throw new Error("Параметр id не найден")
//   }

//   const id = params.id

//   // Загружаем сообщения при изменении диалога (первый заход)
//   useEffect(() => {
//     if (!id || joinedRef.current) return

//     const messageHandler = (message: MessageType) => {
//       console.log("New message", message)
//       dispatch(addMessageFromSocket(message))
//     }

//     dispatch(clearMessages())
//     console.log(
//       "dispatch(getUserMessagesThunk({ dialogId: id, page: 1 })) сработал после dispatch(clearMessages())  "
//     )
//     dispatch(getUserMessagesThunk({ dialogId: id, page: 1 }))

//     // hasLoadedRef.current = true

//     socket.emit("joinDialog", id)
//     socket.on("newMessage", messageHandler)

//     joinedRef.current = true

//     return () => {
//       socket.emit("leaveDialog", id)
//       socket.off("newMessage", messageHandler)
//       joinedRef.current = false
//     }
//   }, [id, dispatch, socket])

//   // useEffect(() => {
//   //   // Сброс флага при смене диалога
//   //   hasLoadedRef.current = false
//   // }, [id])

//   useEffect(() => {
//     console.log("id", id)
//     console.log("currentDialog?._id", currentDialog?._id)
//     console.log("currentPage******** before", currentPage)

//     if (!id || currentDialog?._id !== id || currentPage === 1) return
//     console.log(
//       "Сработал dispatch(getUserMessagesThunk({ dialogId: id, page: currentPage }))"
//     )
//     console.log("currentPage******** after", currentPage)
//     dispatch(getUserMessagesThunk({ dialogId: id, page: currentPage }))
//   }, [dispatch, currentPage, id, currentDialog?._id])

//   const lastMessageRef = useCallback(
//     (node: HTMLDivElement | null) => {
//       if (loading || !hasLoaded) return

//       if (observerRef.current) observerRef.current.disconnect()

//       observerRef.current = new IntersectionObserver(
//         (entries) => {
//           if (entries[0].isIntersecting && hasMore) {
//             console.log(
//               "currentPage******** before changeCurrantPage()",
//               currentPage
//             )

//             console.log("Сработал dispatch(changeCurrantPage())")
//             dispatch(changeCurrantPage())
//             console.log(
//               "currentPage******** after changeCurrantPage()",
//               currentPage
//             )
//           }
//         },
//         {
//           threshold: 1, // 👈 Весь элемент должен быть в зоне видимости
//           // rootMargin: "0px 0px -100px 0px",
//         }
//       )

//       if (node) observerRef.current.observe(node)
//     },
//     [loading, hasMore, dispatch, hasLoaded]
//   )
//   const optionHeaderMessage = useHideOnScroll()

//   if (!recipientId && loading)
//     return (
//       <div style={{ paddingTop: "50px" }}>
//         <Spinner />
//       </div>
//     )

//   if (!recipientId) return <div>Диалог не найден</div>

//   const handleSendMessage = async () => {
//     try {
//       socket.emit("sendMessage", {
//         recipientUserId: recipientId._id,
//         text: textMessage,
//         id,
//       })
//       // setTimeout(() => {
//       //   // window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
//       //   // scrollContainerRef.current?.scrollTo({ behavior: "smooth" })

//       //   const container = scrollContainerRef.current
//       //   if (!container) return
//       window.scrollTo({ top: 0, behavior: "smooth" })
//       // container.scrollTo({ top: container.scrollHeight, behavior: "smooth" })
//       // }, 500)

//       setTextMessage("")
//     } catch (error) {
//       console.log(error)
//     }
//   }

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === "Enter") {
//       e.preventDefault() // чтобы не было лишних переносов
//       handleSendMessage()
//     }
//   }

//   return (
//     <>
//       {/* {loading && <SpinnerWindow />} */}
//       <div className={style.container}>
//         <div
//           className={`${style.userInfo}
//           ${!optionHeaderMessage ? style.moveHeaderMessage : ""}`}
//         >
//           <Link href={"/dialogs/"} className={style.buttonBackBlock}>
//             <ArrowBack />
//           </Link>
//           <ProfileLink userId={recipientId._id} currentUserId={userId}>
//             <div className={style.userImgOnlineBlock}>
//               <div className={style.blockImg}>
//                 <CloudinaryImage
//                   src={recipientId.avatar}
//                   alt="avatar"
//                   width={200}
//                   height={200}
//                 />
//               </div>
//               {usersOnline[recipientId._id]?.isOnline && (
//                 <div className={style.onlineBlock}></div>
//               )}
//             </div>
//           </ProfileLink>
//           <div>
//             <div>{recipientId.username}</div>

//             {!status.isOnline && status.lastSeen && (
//               <div className={style.lastSeen}>
//                 <span>был(а):</span> <span>{formatData(status.lastSeen)}</span>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* <h2>dialog</h2> */}
//         <div className={style.contentMessageBlock}>
//           {messages.length > 0 && (
//             <div className={style.messagesList}>
//               {messages.map((message, i) => {
//                 const isLast = i === messages.length - 1
//                 return (
//                   <div
//                     key={message._id}
//                     className={`${style.messageList} ${
//                       message.senderId._id !== userId
//                         ? style.recipient
//                         : style.me
//                     }`}
//                     ref={isLast ? lastMessageRef : null}
//                   >
//                     <div>{message.text}</div>
//                     <div>{formatMessageTime(message.createdAt)}</div>
//                   </div>
//                 )
//               })}
//               {loading && <Spinner />}
//             </div>
//           )}

//           {/* <div ref={messagesEndRef} /> */}
//         </div>
//         <div
//           className={`${style.newMessageBlock} ${
//             !optionHeaderMessage ? style.moveHeaderMessage : ""
//           }`}
//         >
//           <div className={style.newMessageBlockInput}>
//             <input
//               type="text"
//               placeholder="Сообщение"
//               onChange={(e) => setTextMessage(e.target.value)}
//               value={textMessage}
//               onKeyDown={handleKeyDown}
//             />
//           </div>
//           <div
//             onClick={handleSendMessage}
//             title="Отправить сообщение"
//             className={style.newMessageButtonBlock}
//           >
//             <SendMessage />
//           </div>
//         </div>
//       </div>
//     </>
//   )
// }
