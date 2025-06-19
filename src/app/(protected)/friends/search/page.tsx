"use client"
import { useEffect } from "react"
import style from "./SearchFriends.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import {
  getAllUsersThunk,
  getMyFriendsIdThunk,
} from "@/store/thunks/usersThunk"
import UserBlock from "@/components/userBlock/UserBlock"
export default function SearchFriends() {
  const users = useAppSelector((state: RootState) => state.users.users)
  const friendRequests = useAppSelector(
    (state: RootState) => state.users.friendRequests
  )
  const friends = useAppSelector((state: RootState) => state.users.friends)
  const sentFriendRequests = useAppSelector(
    (state: RootState) => state.users.sentFriendRequests
  )
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)

  const dispatch = useAppDispatch()
  useEffect(() => {
    if (isAuth) {
      dispatch(getAllUsersThunk())
      dispatch(getMyFriendsIdThunk())
    }
  }, [isAuth])
  // console.log("friends", friends)
  // console.log("friendRequests", friendRequests)
  // console.log("sentFriendRequests", sentFriendRequests)
  // console.log("users", users)
  return (
    <div className={style.wrapper}>
      <h2>SearchFriends</h2>
      {users.length > 0 &&
        users.map((user) => {
          let status: "friend" | "incoming" | "outgoing" | "none" = "none"
          if (friends.some((f) => f._id === user._id)) {
            status = "friend"
          } else if (friendRequests.some((r) => r._id === user._id)) {
            status = "incoming"
          } else if (sentFriendRequests.some((s) => s._id === user._id)) {
            status = "outgoing"
          }
          console.log(user.username, status)
          return (
            <UserBlock
              key={user._id}
              avatar={user.avatar}
              userName={user.username}
              id={user._id}
              status={status}
            />
          )
        })}
    </div>
  )
}
