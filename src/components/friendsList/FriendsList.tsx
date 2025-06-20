"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import style from "./FriendsList.module.scss"
import { RootState } from "@/store/store"
import ButtonMenu from "../ui/button/Button"
// import { getUserProfileThunk } from "@/store/thunks/profileThunk"
import { useRouter } from "next/navigation"
import {
  acceptFriendThunk,
  cancelRequestFriendThunk,
  delFriendThunk,
} from "@/store/thunks/usersThunk"
import Image from "next/image"

type FriendsListProps = {
  type: "friendRequests" | "friends" | "sentFriendRequests" // ограничим, чтобы был ключ из users
}

const FriendsList = ({ type }: FriendsListProps) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const title = {
    friendRequests: "Заявки в друзья",
    friends: "Друзья",
    sentFriendRequests: "Мои заявки",
  }
  const messageType = {
    friendRequests: "Принять заявку",
    friends: "Удалить друга",
    sentFriendRequests: "Отменить заявку",
  }

  const handleClick = (type: string, userId: string) => {
    switch (type) {
      case "friendRequests":
        return dispatch(acceptFriendThunk(userId))
      case "friends":
        return dispatch(delFriendThunk(userId))
      case "sentFriendRequests":
        return dispatch(cancelRequestFriendThunk(userId))
    }
  }

  // Берём нужный массив из users по ключу type
  const list = useAppSelector(
    (state: RootState) => state.users[type]
  ) as Array<{ _id: string; username: string; avatar: string }>

  const handleLinkUser = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  return (
    <div className={style.wrapper}>
      <h2>{title[type]}</h2>
      {list.length === 0 ? (
        <p>Пусто</p>
      ) : (
        list.map((user) => (
          <div key={user._id} className={style.containerUser}>
            <div
              className={style.imgNameContainer}
              onClick={() => handleLinkUser(user._id)}
            >
              <div className={style.containerImg}>
                <Image
                  src={user.avatar}
                  alt={user.username}
                  width={100}
                  height={100}
                />
              </div>
              <span>{user.username}</span>
            </div>
            <div className={style.buttonContainer}>
              <ButtonMenu
                onClick={() => {
                  handleClick(type, user._id)
                }}
              >
                {messageType[type]}
              </ButtonMenu>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default FriendsList
