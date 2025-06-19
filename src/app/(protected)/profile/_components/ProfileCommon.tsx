"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  getMyProfileThunk,
  getUserProfileThunk,
} from "@/store/thunks/profileThunk"
import ProfileBlock from "../ProfileBlock/ProfileBlock"
import PostsBlock from "../../../../components/PostsBlock/PostsBlock"
import { RootState } from "@/store/store"
import {
  getUserPostsByIdThunk,
  getUserPostsThunk,
} from "@/store/thunks/userPostThunk"

// import ProfileBlock from "./ProfileBlock/ProfileBlock"
// import PostsBlock from "./PostsBlock/PostsBlock"

type Props =
  | { isMyProfilePage: true; userId?: never }
  | { isMyProfilePage?: false; userId: string }

const ProfileCommon = ({ isMyProfilePage = false, userId }: Props) => {
  const dispatch = useAppDispatch()
  const profileData = useAppSelector((state: RootState) => state.profile)

  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const posts = useAppSelector((state: RootState) => state.userPost.posts)

  useEffect(() => {
    if (isAuth) {
      if (isMyProfilePage) {
        dispatch(getMyProfileThunk())
        dispatch(getUserPostsThunk())
      } else if (userId) {
        dispatch(getUserProfileThunk(userId))
        dispatch(getUserPostsByIdThunk(userId))
      }
    }
  }, [isMyProfilePage, userId, isAuth, dispatch])
  console.log("profileData", profileData)
  if (profileData.profileLoading) {
    return <div>Загрузка...</div>
  }

  //   if (!profileData.profile) {
  //     return <div>Профиль не найден</div>
  //   }

  return (
    <div>
      <ProfileBlock profileData={profileData} />
      <PostsBlock posts={posts} userId={userId} isProfile />
    </div>
  )
}

export default ProfileCommon
