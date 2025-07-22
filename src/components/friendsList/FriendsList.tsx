"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import style from "./FriendsList.module.scss"
import { RootState } from "@/store/store"
import ButtonMenu from "../ui/button/Button"
// import { getUserProfileThunk } from "@/store/thunks/profileThunk"

import {
  acceptFriendThunk,
  cancelRequestFriendThunk,
  delFriendThunk,
  UserType,
} from "@/store/thunks/usersThunk"
import Image from "next/image"
import { Paginator } from "../Paginator/Paginator"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"
import ConfirmModal from "../ConfirmModal/ConfirmModal"

type FriendsListProps = {
  type: "friendRequests" | "friends" | "sentFriendRequests" // ограничим, чтобы был ключ из users
  users: UserType[]
  page: number
  pages: number
}

const FriendsList = ({ type, users, page, pages }: FriendsListProps) => {
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const loading = useAppSelector((state: RootState) => state.users.loading)
  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const dispatch = useAppDispatch()
  const pageType = {
    friendRequests: "requestsPage",
    friends: "friendsPage",
    sentFriendRequests: "sentPage",
  }
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

  // const pageFromUrl = Number(searchParams.get(pageType[type])) || 1

  const handleClick = (type: string, userId: string) => {
    switch (type) {
      case "friendRequests":
        return dispatch(acceptFriendThunk({ userId, page }))
      case "friends":
        return dispatch(delFriendThunk({ userId, page }))
      case "sentFriendRequests":
        return dispatch(cancelRequestFriendThunk({ userId, page }))
    }
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(pageType[type], String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })

    // dispatch(setRoomPage(newPage)) // переключаем страницу в Redux
  }

  // Берём нужный массив из users по ключу type
  // const list = useAppSelector((state: RootState) => state.users[type])

  const handleLinkUser = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  return (
    <>
      <div className={style.wrapper}>
        <h2>{title[type]}</h2>
        {pages > 1 && (
          <Paginator
            pages={pages}
            onPageChange={handlePageChange}
            page={page}
          />
        )}
        {users.length === 0 ? (
          <p>Пусто</p>
        ) : (
          <div className={style.listsBlock}>
            {users.map((user) => (
              <div key={user._id} className={style.containerUser}>
                <div
                  className={style.imgNameContainer}
                  onClick={() => handleLinkUser(user._id)}
                >
                  <div className={style.imageContainer}>
                    <div className={style.imageBlock}>
                      <Image
                        src={user.avatar}
                        alt={user.username}
                        width={100}
                        height={100}
                      />
                    </div>
                    {usersOnline[user._id]?.isOnline && (
                      <div className={style.onlineBlock}></div>
                    )}
                  </div>
                  <span>{user.username}</span>
                </div>
                <div className={style.buttonContainer}>
                  <ButtonMenu
                    disabled={loading}
                    loading={loading}
                    onClick={() => {
                      // handleClick(type, user._id)
                      if (
                        type === "friendRequests" ||
                        type === "sentFriendRequests"
                      ) {
                        handleClick(type, user._id) // сразу
                      } else {
                        setSelectedUserId(user._id) // сохраняем userId
                        setConfirmVisible(true) // открываем модалку
                      }
                    }}
                  >
                    {messageType[type]}
                  </ButtonMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {type === "friends" && (
        <ConfirmModal
          isOpen={confirmVisible}
          onCancel={() => {
            setSelectedUserId(null)
            setConfirmVisible(false)
          }}
          onConfirm={() => {
            if (selectedUserId) {
              handleClick("friends", selectedUserId)
              setSelectedUserId(null)
            }
            setConfirmVisible(false)
          }}
          title="Удалить друга?"
          message="Вы уверены, что хотите удалить этого пользователя из друзей?"
        />
      )}
    </>
  )
}

export default FriendsList
