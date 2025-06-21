"use client"
import { useParams } from "next/navigation"
import style from "./RoomPage.module.scss"
import { Suspense, useEffect, useState } from "react"
import { RootState } from "@/store/store"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getRoomPostsThunk } from "@/store/thunks/roomPostThunk"

import PostsBlock from "../../../../components/PostsBlock/PostsBlock"
import {
  addFriendsToRoomThunk,
  delFriendFromRoomThunk,
  getMembersFromRoomThunk,
  RoomMemberType,
} from "@/store/thunks/roomsThunk"
import { MemberInfo } from "@/components/memberInfo/MemberInfo"
import ButtonMenu from "@/components/ui/button/Button"
import { AddMembersToRoom } from "../addMembersToRoom/AddMembersToRoom"
import { getUserRelationsThunk } from "@/store/thunks/usersThunk"

const Room = () => {
  const [addFriendsToRoom, setAddFriendsToRoom] = useState(false)
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const userId = useAppSelector((state: RootState) => state.auth.userId)
  const members = useAppSelector((state: RootState) => state.rooms.members)
  const owner = useAppSelector((state: RootState) => state.rooms.owner)
  const loading = useAppSelector((state: RootState) => state.rooms.loading)
  const friends = useAppSelector((state: RootState) => state.users.friends)
  const posts = useAppSelector((state: RootState) => state.roomPost.posts)
  const dispatch = useAppDispatch()
  const { id } = useParams<{ id: string }>()

  const isOwner =
    typeof owner === "object" &&
    owner !== null &&
    " _id" in owner &&
    userId === (owner as RoomMemberType)._id
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
      dispatch(getRoomPostsThunk(id))
      dispatch(getMembersFromRoomThunk(id))
    }
  }, [isAuth, dispatch, id])

  useEffect(() => {
    if (addFriendsToRoom) {
      dispatch(getUserRelationsThunk("friends"))
    }
  }, [addFriendsToRoom, dispatch])

  console.log("owner", owner)
  if (typeof id !== "string") return <div>Неверный ID</div>
  if (!userId) return <div>Юзер не найден</div>

  console.log("posts", posts)
  return (
    <>
      {addFriendsToRoom && (
        <AddMembersToRoom
          members={members}
          friends={friends}
          handleCloseAddMembersFromRoom={handleCloseAddMembersFromRoom}
          onSubmitMembers={onSubmitMembers}
        />
      )}
      <div className={style.containerMembers}>
        <h3>Участники</h3>
        <div className={style.membersBlock}>
          {members.map((member) => (
            <MemberInfo
              key={member._id}
              id={member._id as string}
              name={member.userName}
              avatar={member.avatar}
              delMember={delMember}
              owner={(owner as RoomMemberType)._id || ""}
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
