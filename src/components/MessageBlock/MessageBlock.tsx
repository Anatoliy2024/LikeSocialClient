"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { getUserMessagesThunk } from "@/store/thunks/dialogsThunk"
// import Image from "next/image"
import { useParams } from "next/navigation"
import { useEffect, useRef } from "react"
import style from "./MessageBlock.module.scss"
import { getSocket } from "@/lib/socket"
import { addMessageFromSocket, MessageType } from "@/store/slices/dialogsSlice"
import { formatData } from "@/utils/formatData"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
export const MessageBlock = () => {
  const joinedRef = useRef(false)
  const socket = getSocket()
  const dispatch = useAppDispatch()
  const messages = useAppSelector((state: RootState) => state.dialogs.messages)
  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)
  // const pathname = usePathname()
  // const router = useRouter()
  //   const searchParams = useSearchParams()
  //   const pageRoomFromUrl = Number(searchParams.get("message")) || 1

  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    if (!id || joinedRef.current) return

    const messageHandler = (message: MessageType) => {
      console.log("New message", message)
      dispatch(addMessageFromSocket(message))
    }

    dispatch(getUserMessagesThunk(id))
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

  return (
    <div className={style.container}>
      <h2>dialog</h2>
      <div>
        {messages.length > 0 && (
          <div className={style.messagesList}>
            {messages.map((message) => (
              <li key={message._id} className={style.messageList}>
                <div className={style.userImgOnlineBlock}>
                  <div className={style.blockImg}>
                    <CloudinaryImage
                      src={message.senderId.avatar}
                      alt="avatar"
                      width={200}
                      height={200}
                    />
                  </div>
                  {usersOnline[message.senderId._id]?.isOnline && (
                    <div className={style.onlineBlock}></div>
                  )}
                </div>

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
      </div>
    </div>
  )
}
