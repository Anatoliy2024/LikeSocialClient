"use client"
import FriendsList from "@/components/friendsList/FriendsList"
import ButtonMenu from "@/components/ui/button/Button"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { getUserRelationsThunk } from "@/store/thunks/usersThunk"
import Link from "next/link"
import { useEffect } from "react"
import style from "./Friends.module.scss"
export default function Friends() {
  // const users = useAppSelector((state: RootState) => state.users.users)
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (isAuth) {
      dispatch(getUserRelationsThunk("friends"))
      dispatch(getUserRelationsThunk("requests"))
      dispatch(getUserRelationsThunk("sent"))
    }
  }, [isAuth, dispatch])

  return (
    <div className={style.wrapper}>
      <FriendsList type={"friendRequests"} />
      <FriendsList type={"friends"} />
      <FriendsList type={"sentFriendRequests"} />
      {/* Friends <FriendsList type={"sentFriendRequests"}/> */}
      {/* <FriendsList/> */}
      <Link href="/friends/search">
        <ButtonMenu>Поиск друзей</ButtonMenu>
      </Link>
    </div>
  )
}
