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

type StatusType = "friend" | "incoming" | "outgoing" | "none"

type UserBlockProps = {
  avatar: string
  userName: string
  id: string
  status: StatusType
}

const UserBlock = ({ avatar, userName, id, status }: UserBlockProps) => {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const handleLinkUser = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  let buttonText = ""
  let onClickHandler = () => {}
  // console.log("status", status)
  switch (status) {
    case "friend":
      buttonText = "Удалить из друзей"
      onClickHandler = () => dispatch(delFriendThunk(id))
      break
    case "incoming":
      buttonText = "Принять заявку"
      onClickHandler = () => dispatch(acceptFriendThunk(id))
      break
    case "outgoing":
      buttonText = "Отменить заявку"
      onClickHandler = () => dispatch(cancelRequestFriendThunk(id))
      break
    case "none":
    default:
      buttonText = "Добавить в друзья"
      onClickHandler = () => dispatch(requestFriendThunk(id))
      break
  }
  // console.log("buttonText", buttonText)
  return (
    <div className={style.wrapper}>
      <div className={style.imgNameBlock} onClick={() => handleLinkUser(id)}>
        <div className={style.imgBlock}>
          <img src={avatar} alt="Avatar" />
        </div>
        <div>{userName}</div>
      </div>

      <div className={style.infoBlock}>
        <ButtonMenu onClick={onClickHandler}>{buttonText}</ButtonMenu>
      </div>
    </div>
  )
}

export default UserBlock
