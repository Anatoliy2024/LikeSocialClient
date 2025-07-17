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

  const friendsPageFromUrl = Number(searchParams.get("friendsPage")) || 1
  const requestsPageFromUrl = Number(searchParams.get("requestsPage")) || 1
  const sentPageFromUrl = Number(searchParams.get("sentPage")) || 1

  //   const handlePageChange = (newPage: number) => {
  //     const params = new URLSearchParams(searchParams.toString())
  //     params.set("page", String(newPage))

  //     router.push(`${pathname}?${params.toString()}`, { scroll: false })

  //     // dispatch(setRoomPage(newPage)) // переключаем страницу в Redux
  //   }
  // const users = useAppSelector((state: RootState) => state.users.users)
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

  // const handlePageChange = (newPage: number,type:string) => {
  //   const pageType = {
  //     friendRequests: "friendsPage",
  //     friends: "requestsPage",
  //     sentFriendRequests: "sentPage",
  //   }
  //   const params = new URLSearchParams(searchParams.toString())
  //   params.set(pageType[type], String(newPage))

  //   router.push(`${pathname}?${params.toString()}`, { scroll: false })

  //   // dispatch(setRoomPage(newPage)) // переключаем страницу в Redux
  // }

  return (
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
  )
}
