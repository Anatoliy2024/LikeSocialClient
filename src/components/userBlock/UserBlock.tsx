// import {
//   acceptFriendThunk,
//   cancelRequestFriendThunk,
//   delFriendThunk,
//   requestFriendThunk,
// } from "@/store/thunks/usersThunk"
// import ButtonMenu from "../ui/button/Button"
import style from "./UserBlock.module.scss"
// import { useAppDispatch } from "@/store/hooks"
import { useRouter } from "next/navigation"
// import Image from "next/image"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import { useState } from "react"
// import ConfirmModal from "../ConfirmModal/ConfirmModal"
import { OnlineStatusState } from "@/store/slices/onlineStatusSlice"
// import { DelFriend } from "@/assets/icons/delFriend"
// import { AcceptFriend } from "@/assets/icons/acceptFriend"
// import { DeniedFriendRequest } from "@/assets/icons/deniedFriendRequest"
// import { AddFriend } from "@/assets/icons/addFriend"
import { MessageText } from "@/assets/icons/messageText"
import { CreateUserMessageModal } from "../createUserMessageModal/CreateUserMessageModal"
import { ButtonUserStatus } from "../buttonUserStatus/ButtonUserStatus"

type StatusType = "friend" | "incoming" | "outgoing" | "none"

type UserBlockProps = {
  avatar: string
  userName: string
  id: string
  status: StatusType
  page: number
  usersOnline: OnlineStatusState
}

const UserBlock = ({
  avatar,
  userName,
  id,
  status,
  page,
  usersOnline,
}: UserBlockProps) => {
  // const [isConfirmOpen, setConfirmOpen] = useState(false)
  const [showModalCreateMessage, setShowModalCreateMessage] = useState(false)

  // const dispatch = useAppDispatch()
  const router = useRouter()

  const handleLinkUser = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  // const handleDelete = () => {
  //   dispatch(delFriendThunk({ userId: id, page }))
  //   setConfirmOpen(false)
  // }

  // const messageComponentMap = {
  //   friendRequests: <AcceptFriend />,
  //   friends: <DelFriend />,
  //   sentFriendRequests: <DeniedFriendRequest />,
  // }

  // let friendStatusButtonBlock = null
  // let onClickHandler = () => {}
  // // console.log("status", status)
  // switch (status) {
  //   case "friend":
  //     friendStatusButtonBlock = <DelFriend />
  //     onClickHandler = () => setConfirmOpen(true)
  //     //  dispatch(delFriendThunk({ userId: id, page }))
  //     break
  //   case "incoming":
  //     friendStatusButtonBlock = <AcceptFriend />
  //     onClickHandler = () => dispatch(acceptFriendThunk({ userId: id, page }))
  //     break
  //   case "outgoing":
  //     friendStatusButtonBlock = <DeniedFriendRequest />
  //     onClickHandler = () =>
  //       dispatch(cancelRequestFriendThunk({ userId: id, page }))
  //     break
  //   case "none":
  //   default:
  //     friendStatusButtonBlock = <AddFriend />

  //     onClickHandler = () => dispatch(requestFriendThunk({ userId: id, page }))
  //     break
  // }

  const handleShowModalCreateMessage = () => {
    setShowModalCreateMessage(true)
  }
  const handleCloseModalCreateMessage = () => {
    setShowModalCreateMessage(false)
  }

  // console.log("buttonText", buttonText)
  return (
    <>
      {showModalCreateMessage && id && (
        <CreateUserMessageModal
          onClose={handleCloseModalCreateMessage}
          userId={id}
        />
      )}
      <div className={style.wrapper}>
        <div className={style.imgNameBlock} onClick={() => handleLinkUser(id)}>
          <div className={style.imageContainer}>
            <div className={style.imgBlock}>
              <CloudinaryImage
                src={avatar}
                alt="Avatar"
                width={400}
                height={400}
              />
            </div>
            {usersOnline[id]?.isOnline && (
              <div className={style.onlineBlock}></div>
            )}
          </div>
          <div>{userName}</div>
        </div>
        <div className={style.buttonContainer}>
          <div
            className={style.buttonBlock}
            onClick={handleShowModalCreateMessage}
          >
            <MessageText />
          </div>
          <ButtonUserStatus status={status} page={page} id={id} />
          {/* <div className={style.buttonBlock} onClick={onClickHandler}>
            {friendStatusButtonBlock}
          </div> */}
        </div>

        {/* <div className={style.infoBlock}>
          <ButtonMenu onClick={onClickHandler}>{buttonText}</ButtonMenu>
        </div> */}
      </div>
    </>
  )
}

export default UserBlock
