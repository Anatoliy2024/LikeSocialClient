"use client"
import { useParams } from "next/navigation"
import style from "./RoomPage.module.scss"
import { Suspense, useEffect, useState } from "react"

import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getRoomPostsThunk } from "@/store/thunks/roomPostThunk"

import PostsBlock from "../../../../components/PostsBlock/PostsBlock"
import {
  addFriendsToRoomThunk,
  changeAvatarRoomThunk,
  delFriendFromRoomThunk,
  getRoomByIdThunk,
  RoomMemberType,
} from "@/store/thunks/roomsThunk"
import { MemberInfo } from "@/components/memberInfo/MemberInfo"
import ButtonMenu from "@/components/ui/button/Button"
import { AddMembersToRoom } from "../addMembersToRoom/AddMembersToRoom"
import { getUserRelationsThunk } from "@/store/thunks/usersThunk"
import Image from "next/image"
import { ChangeAvatarModal } from "@/components/changeAvatarModal/ChangeAvatarModal"
import { setRoomPage } from "@/store/slices/roomPostsSlice"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { RootState } from "@/store/store"

const Room = () => {
  const [addFriendsToRoom, setAddFriendsToRoom] = useState(false)
  const [changeAvatarModal, setChangeAvatarModal] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pageRoomFromUrl = Number(searchParams.get("pageRoom")) || 1
  const pageUserFriendsFromUrl =
    Number(searchParams.get("pageUserFriends")) || 1
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const userId = useAppSelector((state: RootState) => state.auth.userId)

  const room = useAppSelector((state: RootState) => state.rooms.room)
  // const members = useAppSelector((state: RootState) => state.rooms.room?.members)

  // const owner = useAppSelector((state: RootState) => state.rooms.room?.owner)
  // const avatar = useAppSelector((state: RootState) => state.rooms.room?.avatar)
  // const owner = useAppSelector((state: RootState) => state.rooms.room?.owner)
  // const members = useAppSelector((state: RootState) => state.rooms.members)
  // const owner = useAppSelector((state: RootState) => state.rooms.owner)
  const loading = useAppSelector((state) => state.rooms.loading)
  const {
    users: friends,
    page: friendsPage,
    pages: friendsPages,
  } = useAppSelector((state) => state.users.friends)
  const { posts, page, pages } = useAppSelector((state) => state.roomPost)
  const dispatch = useAppDispatch()
  const { id } = useParams<{ id: string }>()

  const isOwner =
    typeof room?.owner === "object" &&
    room?.owner !== null &&
    "_id" in room?.owner &&
    userId === (room?.owner as RoomMemberType)._id
  const handleAddMembersFromRoom = () => {
    setAddFriendsToRoom(true)
  }
  const handleCloseAddMembersFromRoom = () => {
    setAddFriendsToRoom(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("pageUserFriends") // удаляем параметр страницы

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const onSubmitMembers = (members: string[]) => {
    // console.log("members", members)
    dispatch(addFriendsToRoomThunk({ users: members, roomId: id })).then(() => {
      // dispatch(getMembersFromRoomThunk(id)) // обновим список участников
      handleCloseAddMembersFromRoom()
    })
  }

  const delMember = (userId: string) => {
    // console.log("members", members)
    // console.log("delMember", id)

    dispatch(delFriendFromRoomThunk({ userId: userId, roomId: id }))
  }
  useEffect(() => {
    if (isAuth && typeof id === "string") {
      dispatch(setRoomPage(pageRoomFromUrl))
      dispatch(getRoomPostsThunk({ roomId: id, page: pageRoomFromUrl }))
    }
  }, [isAuth, dispatch, id, pageRoomFromUrl])

  useEffect(() => {
    if (isAuth && typeof id === "string") {
      dispatch(getRoomByIdThunk(id))
    }
  }, [isAuth, dispatch, id])

  // useEffect(() => {
  //   if (isAuth) {
  //     console.log("roomId", id)
  //     dispatch(getRoomPostsThunk({ roomId: id, page }))
  //     dispatch(getRoomByIdThunk(id))
  //   }
  // }, [isAuth, dispatch, id,page])

  // useEffect(() => {
  //   if (isAuth && typeof id === "string") {
  //     dispatch(setRoomPage(pageFromUrl)) // обновляем Redux
  //     dispatch(getRoomPostsThunk({ roomId: id, page: pageFromUrl })) // грузим посты
  //     dispatch(getRoomByIdThunk(id)) // грузим инфо о комнате
  //   }
  // }, [isAuth, dispatch, id, pageFromUrl])

  // useEffect(() => {
  //   if (isAuth && typeof id === "string") {
  //     dispatch(getRoomPostsThunk({ roomId: id, page }))
  //   }
  // }, [page])

  useEffect(() => {
    if (addFriendsToRoom) {
      dispatch(
        getUserRelationsThunk({ type: "friends", page: pageUserFriendsFromUrl })
      )
    }
  }, [addFriendsToRoom, dispatch, pageUserFriendsFromUrl])

  console.log("owner", room?.owner)
  if (typeof id !== "string") return <div>Неверный ID</div>
  if (!userId) return <div>Юзер не найден</div>

  const handleRoomAvatarUpload = async (
    file: File,
    context?: { roomId?: string }
  ) => {
    if (!context?.roomId) return
    await dispatch(
      changeAvatarRoomThunk({ file, roomId: context.roomId })
    ).unwrap()
  }

  const handleCloseModal = () => {
    setChangeAvatarModal(false)
  }
  const handleOpenModal = () => {
    if (isOwner) {
      setChangeAvatarModal(true)
    }
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("pageRoom", String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })

    // dispatch(setRoomPage(newPage)) // переключаем страницу в Redux
  }
  const handleChangeUrlFriendsPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("pageUserFriends", String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })

    // dispatch(setRoomPage(newPage)) // переключаем страницу в Redux
  }

  // console.log("posts", posts)
  return (
    <>
      {addFriendsToRoom && (
        <AddMembersToRoom
          members={room?.members as []}
          friends={friends}
          handleCloseAddMembersFromRoom={handleCloseAddMembersFromRoom}
          onSubmitMembers={onSubmitMembers}
          onChangePageFriends={handleChangeUrlFriendsPage}
          page={friendsPage}
          pages={friendsPages}
        />
      )}
      {changeAvatarModal && (
        <ChangeAvatarModal
          handleCloseModal={handleCloseModal}
          loading={loading}
          onUpload={handleRoomAvatarUpload}
          context={{ roomId: id }}
        />
      )}
      <div className={style.containerMembers}>
        <div className={style.blockRoomMainInfo}>
          <div className={style.blockAvatarRoom} onClick={handleOpenModal}>
            <Image
              src={room?.avatar || ""}
              alt="roomAvatar"
              width={200}
              height={200}
            />
          </div>
          <div>
            <div>
              <span>Название комнаты:</span>
              <span>{room?.name}</span>
            </div>
            <div>
              <span>Описание комнаты:</span>
              <span>{room?.description}</span>
            </div>
          </div>
        </div>
        <h3>Участники</h3>
        <div className={style.membersBlock}>
          {room?.members.map((member) => (
            <MemberInfo
              key={member._id}
              id={member._id as string}
              name={member.username}
              avatar={member.avatar}
              delMember={delMember}
              owner={(room?.owner as RoomMemberType)._id || ""}
              isOwner={isOwner}
            />
          ))}
        </div>
        {isOwner && (
          <div>
            <ButtonMenu
              disabled={loading}
              loading={loading}
              onClick={handleAddMembersFromRoom}
            >
              Добавить участника
            </ButtonMenu>
          </div>
        )}
      </div>
      <Suspense fallback={<div>Загрузка...</div>}>
        <PostsBlock
          posts={posts}
          userId={userId}
          isProfile={false}
          page={page}
          pages={pages}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </Suspense>
    </>
  )
}
export default Room
