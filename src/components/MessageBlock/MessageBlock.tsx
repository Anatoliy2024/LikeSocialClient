"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { getUserMessagesThunk } from "@/store/thunks/dialogsThunk"
// import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import style from "./MessageBlock.module.scss"
import { getSocket } from "@/lib/socket"
import {
  addMessageFromSocket,
  changeCurrantPage,
  clearMessages,
  MessageType,
} from "@/store/slices/dialogsSlice"
import { formatData } from "@/utils/formatData"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import ButtonMenu from "../ui/button/Button"
import { CreateUserMessageModal } from "../createUserMessageModal/CreateUserMessageModal"

import { ProfileLink } from "../ProfileLink/ProfileLink"
export const MessageBlock = () => {
  const [showModalCreateMessage, setShowModalCreateMessage] = useState(false)

  const joinedRef = useRef(false)
  const socket = getSocket()
  const dispatch = useAppDispatch()
  // const messages = useAppSelector((state: RootState) => state.dialogs.messages)
  const { messages, hasMore, currentPage, currentDialog } = useAppSelector(
    (state) => state.dialogs
  )

  const userId = useAppSelector((state) => state.auth.userId)

  const recipientId = currentDialog?.members.find(
    (member: string) => member !== userId
  )
  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)
  // const pathname = usePathname()
  // const router = useRouter()
  //   const searchParams = useSearchParams()
  //   const pageRoomFromUrl = Number(searchParams.get("message")) || 1

  const { id } = useParams<{ id: string }>()
  useEffect(() => {
    dispatch(getUserMessagesThunk({ dialogId: id, page: currentPage }))
  }, [dispatch, currentPage, id])

  useEffect(() => {
    if (!id || joinedRef.current) return

    const messageHandler = (message: MessageType) => {
      console.log("New message", message)
      dispatch(addMessageFromSocket(message))
    }
    dispatch(clearMessages())
    socket.emit("joinDialog", id)
    socket.on("newMessage", messageHandler)
    //  socket.on("online-users", (users) => {
    //       dispatch(setOnlineStatusList(users))
    //       console.log("Сейчас онлайн:", users)
    //       // Тут можешь диспатчить в стор, если хочешь хранить онлайн список
    //     })
    joinedRef.current = true

    return () => {
      socket.emit("leaveDialog", id)
      socket.off("newMessage", messageHandler) // отписка от события
      joinedRef.current = false
    }
  }, [id, socket, dispatch])

  // console.log("id", id)
  // console.log("messages", messages)

  const handleShowModalCreateMessage = () => {
    setShowModalCreateMessage(true)
  }
  const handleCloseModalCreateMessage = () => {
    setShowModalCreateMessage(false)
  }

  return (
    <>
      {showModalCreateMessage && recipientId && (
        <CreateUserMessageModal
          onClose={handleCloseModalCreateMessage}
          userId={recipientId}
          dialogId={id}
        />
      )}
      <div className={style.container}>
        {/* <h2>dialog</h2> */}

        <ButtonMenu onClick={handleShowModalCreateMessage}>
          Написать сообщение
        </ButtonMenu>

        <div>
          {messages.length > 0 && (
            <div className={style.messagesList}>
              {messages.map((message) => (
                <li key={message._id} className={style.messageList}>
                  <ProfileLink
                    userId={message.senderId._id}
                    currentUserId={userId}
                  >
                    <div className={style.userImgOnlineBlock}>
                      <div className={style.blockImg}>
                        <CloudinaryImage
                          src={message.senderId.avatar}
                          alt="avatar"
                          width={200}
                          height={200}
                        />
                      </div>
                      {usersOnline[message.senderId._id]?.isOnline &&
                        message.senderId._id !== userId && (
                          <div className={style.onlineBlock}></div>
                        )}
                    </div>
                  </ProfileLink>

                  {/*                 
                <div className=''>
                  <Image
                    src={message.senderId.avatar}
                    width={60}
                    height={60}
                    alt="userAvatar"
                  />
                </div> */}
                  <div className={style.contentBlock}>
                    <div>{message.text}</div>
                    <div>{formatData(message.createdAt)}</div>
                  </div>
                </li>
              ))}
            </div>
          )}
          {hasMore && (
            <div className={style.buttonNextPage}>
              <ButtonMenu
                onClick={() => {
                  dispatch(changeCurrantPage())
                }}
              >
                следующая страница
              </ButtonMenu>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// "use client"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { RootState } from "@/store/store"
// import { getUserMessagesThunk } from "@/store/thunks/dialogsThunk"
// // import Image from "next/image"
// import { useParams } from "next/navigation"
// import { useCallback, useEffect, useRef, useState } from "react"
// import style from "./MessageBlock.module.scss"
// import { getSocket } from "@/lib/socket"
// import {
//   addMessageFromSocket,
//   clearMessages,
//   MessageType,
// } from "@/store/slices/dialogsSlice"
// import { formatData } from "@/utils/formatData"
// import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
// import { CreateUserMessageModal } from "../createUserMessageModal/CreateUserMessageModal"
// import ButtonMenu from "../ui/button/Button"
// export const MessageBlock = () => {
//   // const [page, setPage] = useState(1)
//   const [showModalCreateMessage, setShowModalCreateMessage] = useState(false)
//   // const pageRef = useRef(page)

//   const joinedRef = useRef(false)
//   const socket = getSocket()
//   const dispatch = useAppDispatch()
//   // const messages = useAppSelector((state: RootState) => state.dialogs.messages)
//   const { messages, hasMore, loading, currentPage } = useAppSelector(
//     (state) => state.dialogs
//   )
//   const userId = useAppSelector((state: RootState) => state.auth.userId)
//   const dialog = useAppSelector(
//     (state: RootState) => state.dialogs.currentDialog
//   )
//   const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)

//   // const messagesContainerRef = useRef<HTMLDivElement | null>(null)

//   // const pathname = usePathname()
//   // const router = useRouter()
//   //   const searchParams = useSearchParams()
//   //   const pageRoomFromUrl = Number(searchParams.get("message")) || 1
//   const { id } = useParams<{ id: string }>()

//   const bottomRef = useRef(null)

//   useEffect(() => {
//     dispatch(clearMessages())
//     dispatch(getUserMessagesThunk({ dialogId: id, page: 1 }))
//   }, [id, dispatch])

//   const observer = useRef<IntersectionObserver | null>(null)
//   const lastMessageRef = useCallback(
//     (node: HTMLDivElement) => {
//       if (loading) return
//       if (observer.current) observer.current.disconnect()
//       observer.current = new IntersectionObserver((entries) => {
//         if (entries[0].isIntersecting && hasMore) {
//           dispatch(getUserMessagesThunk({ dialogId: id, page: currentPage }))
//         }
//       })
//       if (node) observer.current.observe(node)
//     },
//     [loading, hasMore, currentPage, dispatch, id]
//   )

//   // useEffect(() => {
//   //   pageRef.current = page
//   // }, [page])

//   // useEffect(() => {
//   //   const container = messagesContainerRef.current
//   //   if (!container) return

//   //   const handleScroll = () => {
//   //     if (
//   //       container.scrollTop + container.clientHeight >=
//   //       container.scrollHeight - 50
//   //     ) {
//   //       const nextPage = pageRef.current + 1
//   //       dispatch(getUserMessagesThunk({ dialogId: id, page: nextPage }))
//   //       pageRef.current = nextPage
//   //       setPage(nextPage)
//   //     }
//   //   }

//   //   container.addEventListener("scroll", handleScroll)
//   //   return () => {
//   //     container.removeEventListener("scroll", handleScroll)
//   //   }
//   // }, [id, dispatch])

//   console.log("dialog", dialog)

//   const recipientUserId = dialog?.members.find((member) => member !== userId)
//   console.log("recipientUserId", recipientUserId)

//   const handleShowModalCreateMessage = () => {
//     setShowModalCreateMessage(true)
//   }
//   const handleCloseModalCreateMessage = () => {
//     setShowModalCreateMessage(false)
//   }

//   useEffect(() => {
//     if (!id || joinedRef.current) return

//     const messageHandler = (message: MessageType) => {
//       console.log("New message", message)
//       dispatch(addMessageFromSocket(message))
//     }

//     // dispatch(getUserMessagesThunk(id))
//     socket.emit("joinDialog", id)
//     socket.on("newMessage", messageHandler)
//     //  socket.on("online-users", (users) => {
//     //       dispatch(setOnlineStatusList(users))
//     //       console.log("Сейчас онлайн:", users)
//     //       // Тут можешь диспатчить в стор, если хочешь хранить онлайн список
//     //     })
//     joinedRef.current = true

//     return () => {
//       socket.emit("leaveDialog", id)
//       socket.off("newMessage", messageHandler) // отписка от события
//       joinedRef.current = false
//     }
//   }, [id, socket, dispatch])

//   // console.log("id", id)
//   // console.log("messages", messages)

//   return (
//     <>
//       {showModalCreateMessage && recipientUserId && (
//         <CreateUserMessageModal
//           onClose={handleCloseModalCreateMessage}
//           userId={recipientUserId}
//           dialogId={id}
//         />
//       )}

//       <div className={style.container}>
//         <h2>dialog</h2>

//         <ButtonMenu onClick={handleShowModalCreateMessage}>
//           Написать сообщение
//         </ButtonMenu>

//         <div>
//           {messages.length > 0 && (
//             <div className={style.messagesList}>
//               {messages.map((message, index) => {
//                 const isLast = index === messages.length - 1
//                 return (
//                   <div
//                     key={message._id}
//                     className={style.messageList}
//                     ref={isLast ? lastMessageRef : null}
//                   >
//                     <div className={style.userImgOnlineBlock}>
//                       <div className={style.blockImg}>
//                         <CloudinaryImage
//                           src={message.senderId.avatar}
//                           alt="avatar"
//                           width={200}
//                           height={200}
//                         />
//                       </div>
//                       {usersOnline[message.senderId._id]?.isOnline &&
//                         message.senderId._id !== userId && (
//                           <div className={style.onlineBlock}></div>
//                         )}
//                     </div>

//                     {/*
//                 <div className=''>
//                   <Image
//                     src={message.senderId.avatar}
//                     width={60}
//                     height={60}
//                     alt="userAvatar"
//                   />
//                 </div> */}
//                     <div className={style.contentBlock}>
//                       <div>{message.text}</div>
//                       <div>{formatData(message.createdAt)}</div>
//                     </div>
//                   </div>
//                 )
//               })}
//               <div ref={bottomRef}></div>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   )
// }
