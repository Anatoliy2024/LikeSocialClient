import {
  acceptFriendThunk,
  cancelRequestFriendThunk,
  delFriendThunk,
  requestFriendThunk,
} from "@/store/thunks/usersThunk"
import ButtonMenu from "../ui/button/Button"
import style from "./UserBlock.module.scss"
import { useAppDispatch } from "@/store/hooks"
import { useRouter } from "next/navigation"
// import Image from "next/image"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import { useState } from "react"
import ConfirmModal from "../ConfirmModal/ConfirmModal"

type StatusType = "friend" | "incoming" | "outgoing" | "none"

type UserBlockProps = {
  avatar: string
  userName: string
  id: string
  status: StatusType
  page: number
}

const UserBlock = ({ avatar, userName, id, status, page }: UserBlockProps) => {
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const dispatch = useAppDispatch()
  const router = useRouter()

  const handleLinkUser = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  const handleDelete = () => {
    dispatch(delFriendThunk({ userId: id, page }))
    setConfirmOpen(false)
  }

  let buttonText = ""
  let onClickHandler = () => {}
  // console.log("status", status)
  switch (status) {
    case "friend":
      buttonText = "Удалить из друзей"
      onClickHandler = () => setConfirmOpen(true)
      //  dispatch(delFriendThunk({ userId: id, page }))
      break
    case "incoming":
      buttonText = "Принять заявку"
      onClickHandler = () => dispatch(acceptFriendThunk({ userId: id, page }))
      break
    case "outgoing":
      buttonText = "Отменить заявку"
      onClickHandler = () =>
        dispatch(cancelRequestFriendThunk({ userId: id, page }))
      break
    case "none":
    default:
      buttonText = "Добавить в друзья"

      onClickHandler = () => dispatch(requestFriendThunk({ userId: id, page }))
      break
  }
  // console.log("buttonText", buttonText)
  return (
    <>
      <div className={style.wrapper}>
        <div className={style.imgNameBlock} onClick={() => handleLinkUser(id)}>
          <div className={style.imgBlock}>
            <CloudinaryImage
              src={avatar}
              alt="Avatar"
              width={400}
              height={400}
            />
          </div>
          <div>{userName}</div>
        </div>

        <div className={style.infoBlock}>
          <ButtonMenu onClick={onClickHandler}>{buttonText}</ButtonMenu>
        </div>
      </div>

      {status === "friend" && (
        <ConfirmModal
          isOpen={isConfirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleDelete}
          title="Удалить друга?"
          message="Вы уверены, что хотите удалить этого пользователя из друзей?"
        />
      )}
    </>
  )
}

export default UserBlock
