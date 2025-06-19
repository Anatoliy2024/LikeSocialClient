// "use client"
// import PostsBlock from "./PostsBlock/PostsBlock"
// import ProfileBlock from "./ProfileBlock/ProfileBlock"
// // import style from "./Profile.module.scss"
// import { useEffect } from "react"
// import {
//   getMyProfileThunk,
//   // getUserProfileThunk,
// } from "@/store/thunks/profileThunk"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { RootState } from "@/store/store"

// export default function Profile() {
//   const dispatch = useAppDispatch()
//   const profileData = useAppSelector((state: RootState) => state.profile)
//   const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
//   console.log(profileData)
//   useEffect(() => {
//     // dispatch(getUserProfileThunk("684866ab89d56d1b8ddcc33d"))
//     if (isAuth) {
//       dispatch(getMyProfileThunk())
//     }
//   }, [isAuth])
//   if (profileData.profileLoading) {
//     return <div>Загрузка...</div>
//   }

//   if (!profileData) {
//     return <div>Данные профиля не найдены</div>
//   }

//   return (
//     <div>
//       <ProfileBlock profileData={profileData} />
//       <PostsBlock />
//     </div>
//   )
// }

// app/profile/page.tsx
"use client"

import ProfileCommon from "./_components/ProfileCommon"

export default function MyProfilePage() {
  return <ProfileCommon isMyProfilePage />
}
