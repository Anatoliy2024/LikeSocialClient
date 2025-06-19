"use client"
import { useParams } from "next/navigation"
import style from "./RoomPage.module.scss"
import { useEffect, useState } from "react"
import { RootState } from "@/store/store"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getRoomPostsThunk } from "@/store/thunks/roomPostThunk"

import PostsBlock from "../../../../components/PostsBlock/PostsBlock"
import {
  addFriendsToRoomThunk,
  delFriendFromRoomThunk,
  getMembersFromRoomThunk,
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
  const friends = useAppSelector((state: RootState) => state.users.friends)
  const posts = useAppSelector((state: RootState) => state.roomPost.posts)
  const dispatch = useAppDispatch()
  const { id } = useParams()

  const isOwner = userId === owner?._id
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

  const delMember = (userId) => {
    // console.log("members", members)
    // console.log("delMember", id)

    dispatch(delFriendFromRoomThunk({ userId: userId, roomId: id }))
  }
  useEffect(() => {
    if (isAuth) {
      dispatch(getRoomPostsThunk(id))
      dispatch(getMembersFromRoomThunk(id))
    }
  }, [isAuth])

  useEffect(() => {
    if (addFriendsToRoom) {
      dispatch(getUserRelationsThunk("friends"))
    }
  }, [addFriendsToRoom])

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
              id={member._id}
              name={member.username}
              avatar={member.avatar}
              delMember={delMember}
              owner={owner._id}
              isOwner={isOwner}
            />
          ))}
        </div>
        {isOwner && (
          <div>
            <ButtonMenu onClick={handleAddMembersFromRoom}>
              Добавить участника
            </ButtonMenu>
          </div>
        )}
      </div>
      <PostsBlock posts={posts} userId={userId} isProfile={false} />
    </>
    // <div className={style.wrapper}>
    //   {posts?.length > 0
    //     ? posts.map((post) => (
    //         <Post
    //           key={post._id}
    //           title={post.title}
    //           content={post.content}
    //           stars={post.stars}
    //           ratings={post.ratings}
    //           createdAt={post.createdAt}
    //           id={post._id}
    //           imagePost={post.imagePost}
    //           userId={userId}
    //         />
    //       ))
    //     : "Постов пока нет"}
    // </div>
  )
}
export default Room
