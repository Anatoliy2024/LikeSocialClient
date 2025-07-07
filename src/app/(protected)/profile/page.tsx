"use client"

import { Suspense } from "react"
import ProfileCommon from "./_components/ProfileCommon"

export default function MyProfilePage() {
  return (
    <Suspense>
      <ProfileCommon isMyProfilePage />
    </Suspense>
  )
}
