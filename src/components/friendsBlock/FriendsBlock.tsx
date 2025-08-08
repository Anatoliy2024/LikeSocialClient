"use client"
import FriendsList from "@/components/friendsList/FriendsList"
import ButtonMenu from "@/components/ui/button/Button"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { getUserRelationsThunk } from "@/store/thunks/usersThunk"
import Link from "next/link"
import { useEffect } from "react"
import style from "./FriendsBlock.module.scss"
import { useSearchParams } from "next/navigation"
import SpinnerWindow from "../ui/spinner/SpinnerWindow"

export function FriendsBlock() {
  // const router = useRouter()
  // const pathname = usePathname()
  const searchParams = useSearchParams()

  const {
    users: friendRequestsUsers,
    page: friendRequestsPage,
    // total: friendRequestsTotal,
    pages: friendRequestsPages,
  } = useAppSelector((state: RootState) => state.users.friendRequests)
  const loading = useAppSelector((state: RootState) => state.users.loading)

  const {
    users: friendsUsers,
    page: friendsPage,
    // total: friendsTotal,
    pages: friendsPages,
  } = useAppSelector((state: RootState) => state.users.friends)

  const {
    users: sentFriendRequestsUsers,
    page: sentRequestsPage,
    // total: sentRequestsTotal,
    pages: sentRequestsPages,
  } = useAppSelector((state: RootState) => state.users.sentFriendRequests)

  const friendsPageFromUrl = Number(searchParams?.get("friendsPage")) || 1
  const requestsPageFromUrl = Number(searchParams?.get("requestsPage")) || 1
  const sentPageFromUrl = Number(searchParams?.get("sentPage")) || 1

  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (isAuth) {
      dispatch(
        getUserRelationsThunk({ type: "friends", page: friendsPageFromUrl })
      )
      dispatch(
        getUserRelationsThunk({ type: "requests", page: requestsPageFromUrl })
      )
      dispatch(getUserRelationsThunk({ type: "sent", page: sentPageFromUrl }))
    }
  }, [
    isAuth,
    dispatch,
    friendsPageFromUrl,
    requestsPageFromUrl,
    sentPageFromUrl,
  ])

  return (
    <>
      {loading && <SpinnerWindow />}
      <div className={style.wrapper}>
        <Link href="/friends/search">
          <div className={style.buttonBlock}>
            <ButtonMenu>Поиск друзей</ButtonMenu>
          </div>
        </Link>
        <FriendsList
          type={"friendRequests"}
          users={friendRequestsUsers}
          page={friendRequestsPage}
          pages={friendRequestsPages}
          // handlePageChange={handlePageChange}
          // urlPage={requestsPageFromUrl}
        />
        <FriendsList
          type={"friends"}
          users={friendsUsers}
          page={friendsPage}
          pages={friendsPages}
          // handlePageChange={handlePageChange}

          // urlPage={friendsPageFromUrl}
        />
        <FriendsList
          type={"sentFriendRequests"}
          users={sentFriendRequestsUsers}
          page={sentRequestsPage}
          pages={sentRequestsPages}
          // handlePageChange={handlePageChange}

          // urlPage={sentPageFromUrl}
        />
        {/* Friends <FriendsList type={"sentFriendRequests"}/> */}
        {/* <FriendsList/> */}
      </div>
    </>
  )
}
