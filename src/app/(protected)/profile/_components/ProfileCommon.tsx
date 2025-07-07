"use client"

import { Suspense, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

import ProfileBlock from "../ProfileBlock/ProfileBlock"
import PostsBlock from "../../../../components/PostsBlock/PostsBlock"
import { RootState } from "@/store/store"
import {
  getUserPostsByIdThunk,
  getUserPostsThunk,
} from "@/store/thunks/userPostThunk"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { setUserPage } from "@/store/slices/userPostsSlice"

type Props =
  | { isMyProfilePage: true; userId?: never }
  | { isMyProfilePage?: false; userId: string }

const ProfileCommon = ({ isMyProfilePage = false, userId }: Props) => {
  const dispatch = useAppDispatch()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pageFromUrl = Number(searchParams.get("page")) || 1
  // // const profileData = useAppSelector((state: RootState) => state.profile)

  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  // const posts = useAppSelector((state: RootState) => state.userPost.posts)
  const { posts, page, pages, loading } = useAppSelector(
    (state) => state.userPost
  )
  useEffect(() => {
    if (!isAuth) return
    if (isAuth) {
      if (isMyProfilePage) {
        dispatch(setUserPage(pageFromUrl))
        // dispatch(getMyProfileThunk())
        dispatch(getUserPostsThunk(pageFromUrl))
      } else if (userId) {
        dispatch(setUserPage(pageFromUrl))

        // dispatch(getUserProfileThunk(userId))
        dispatch(getUserPostsByIdThunk({ userId, page: pageFromUrl }))
      }
    }
  }, [isMyProfilePage, userId, isAuth, dispatch, pageFromUrl])
  // dispatch(setRoomPage(pageFromUrl))
  // dispatch(getRoomPostsThunk({ roomId: id, page: pageFromUrl }))

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })

    // dispatch(setRoomPage(newPage)) // переключаем страницу в Redux
  }

  return (
    <div>
      <ProfileBlock isMyProfilePage={isMyProfilePage} userId={userId} />
      <Suspense fallback={<div>Загрузка...</div>}>
        <PostsBlock
          posts={posts}
          userId={userId}
          isProfile
          page={page}
          pages={pages}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </Suspense>
    </div>
  )
}

export default ProfileCommon
