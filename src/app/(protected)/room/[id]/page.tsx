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

const Room = () => {
  const [addFriendsToRoom, setAddFriendsToRoom] = useState(false)
  const [changeAvatarModal, setChangeAvatarModal] = useState(false)

  const isAuth = useAppSelector((state) => state.auth.isAuth)
  const userId = useAppSelector((state) => state.auth.userId)

  const room = useAppSelector((state) => state.rooms.room)
  // const members = useAppSelector((state: RootState) => state.rooms.room?.members)

  // const owner = useAppSelector((state: RootState) => state.rooms.room?.owner)
  // const avatar = useAppSelector((state: RootState) => state.rooms.room?.avatar)
  // const owner = useAppSelector((state: RootState) => state.rooms.room?.owner)
  // const members = useAppSelector((state: RootState) => state.rooms.members)
  // const owner = useAppSelector((state: RootState) => state.rooms.owner)
  const loading = useAppSelector((state) => state.rooms.loading)
  const friends = useAppSelector((state) => state.users.friends)
  const posts = useAppSelector((state) => state.roomPost.posts)
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
    if (isAuth) {
      console.log("roomId", id)
      dispatch(getRoomPostsThunk(id))
      dispatch(getRoomByIdThunk(id))
    }
  }, [isAuth, dispatch, id])

  useEffect(() => {
    if (addFriendsToRoom) {
      dispatch(getUserRelationsThunk("friends"))
    }
  }, [addFriendsToRoom, dispatch])

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

  // console.log("posts", posts)
  return (
    <>
      {addFriendsToRoom && (
        <AddMembersToRoom
          members={room?.members as []}
          friends={friends}
          handleCloseAddMembersFromRoom={handleCloseAddMembersFromRoom}
          onSubmitMembers={onSubmitMembers}
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
        <PostsBlock posts={posts} userId={userId} isProfile={false} />
      </Suspense>
    </>
  )
}
export default Room
