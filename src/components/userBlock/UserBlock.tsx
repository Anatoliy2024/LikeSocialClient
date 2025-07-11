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
import Image from "next/image"

type StatusType = "friend" | "incoming" | "outgoing" | "none"

type UserBlockProps = {
  avatar: string
  userName: string
  id: string
  status: StatusType
  page: number
}

const UserBlock = ({ avatar, userName, id, status, page }: UserBlockProps) => {
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
      onClickHandler = () => dispatch(delFriendThunk({ userId: id, page }))
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
    <div className={style.wrapper}>
      <div className={style.imgNameBlock} onClick={() => handleLinkUser(id)}>
        <div className={style.imgBlock}>
          <Image src={avatar} alt="Avatar" width={150} height={150} />
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
