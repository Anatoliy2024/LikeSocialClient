"use client"
import { useEffect } from "react"
import style from "./Dialogs.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getUserDialogsThunk } from "@/store/thunks/dialogsThunk"
import { RootState } from "@/store/store"
// import Image from "next/image"
import { formatData } from "@/utils/formatData"
import { useRouter } from "next/navigation"
import { CloudinaryImage } from "@/components/CloudinaryImage/CloudinaryImage"

export default function Dialogs() {
  const dispatch = useAppDispatch()
  const dialogs = useAppSelector((state: RootState) => state.dialogs.dialogs)
  const userId = useAppSelector((state: RootState) => state.auth.userId)
  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)
  const router = useRouter()
  const handleLinkDialog = (dialogId: string) => {
    router.push(`/dialog/${dialogId}`)
  }

  useEffect(() => {
    dispatch(getUserDialogsThunk())
  }, [dispatch])
  console.log("dialogs", dialogs)
  return (
    <div className={style.containerDialogs}>
      {/* <h2>Dialogs</h2> */}
      {dialogs.map.length > 0 ? (
        <ul className={style.dialogLists}>
          {dialogs.map((dialog) => {
            const member = dialog.members.filter(
              (member) => member._id !== userId
            )[0]
            console.log("dialog", dialog)

            return (
              <li
                key={dialog._id}
                className={style.dialogList}
                onClick={() => {
                  handleLinkDialog(dialog._id)
                }}
              >
                <div className={style.mainInfoUserBlock}>
                  <div className={style.containerImageDialogs}>
                    <div className={style.blockImageDialogs}>
                      <CloudinaryImage
                        src={member.avatar}
                        width={200}
                        height={200}
                        alt="userAvatar"
                      />
                    </div>
                    {usersOnline[member._id]?.isOnline && (
                      <div className={style.onlineBlockDialogs}></div>
                    )}
                  </div>
                  <div>{member.username}</div>
                </div>

                {dialog?.lastMessageId && (
                  // <div className={style.dialogContent}>
                  <div className={style.dialogLastMessage}>
                    <div className={style.mainContentLastMessage}>
                      <div className={style.userImgOnlineBlock}>
                        <div className={style.blockImg}>
                          <CloudinaryImage
                            src={dialog.lastMessageId.senderId.avatar}
                            alt="avatar"
                            width={100}
                            height={100}
                          />
                        </div>
                        {/* {usersOnline[dialog.lastMessageId.senderId._id]
                      ?.isOnline && <div className={style.onlineBlock}></div>} */}
                      </div>

                      <div>{dialog.lastMessageId.text}</div>
                    </div>
                    {/* <div className={style.lastMessageAvatar}>
                    <Image
                      src={dialog.lastMessageId.senderId.avatar}
                      width={50}
                      height={50}
                      alt="avatarUser"
                    />
                  </div> */}
                    <div>{formatData(dialog.lastMessageId.createdAt)}</div>
                    {/* <div className={style.contentLastMessage}>
                  </div> */}
                  </div>

                  // </div>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <div>Диалогов пока нет</div>
      )}
    </div>
  )
}
