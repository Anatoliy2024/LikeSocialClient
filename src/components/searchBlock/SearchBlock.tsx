"use client"
import { useEffect } from "react"
import style from "./SearchBlock.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import {
  getAllUsersThunk,
  getMyFriendsIdThunk,
} from "@/store/thunks/usersThunk"
import UserBlock from "@/components/userBlock/UserBlock"
import { Paginator } from "@/components/Paginator/Paginator"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
export function SearchBlock() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlPage = Number(searchParams.get("page")) || 1
  const { users, page, pages } = useAppSelector(
    (state: RootState) => state.users.users
  )
  const friendRequests = useAppSelector(
    (state: RootState) => state.users.friendRequests.users
  )
  const friends = useAppSelector(
    (state: RootState) => state.users.friends.users
  )
  const sentFriendRequests = useAppSelector(
    (state: RootState) => state.users.sentFriendRequests.users
  )
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)

  const dispatch = useAppDispatch()
  useEffect(() => {
    if (isAuth) {
      dispatch(getAllUsersThunk(urlPage))
      dispatch(getMyFriendsIdThunk())
    }
  }, [isAuth, dispatch, urlPage])
  // console.log("friends", friends)
  // console.log("friendRequests", friendRequests)
  // console.log("sentFriendRequests", sentFriendRequests)
  // console.log("users", users)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })

    // dispatch(setRoomPage(newPage)) // переключаем страницу в Redux
  }
  return (
    <div className={style.wrapper}>
      <h2>SearchFriends</h2>
      {pages > 1 && (
        <Paginator page={page} pages={pages} onPageChange={handlePageChange} />
      )}
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
              page={page}
            />
          )
        })}
    </div>
  )
}
