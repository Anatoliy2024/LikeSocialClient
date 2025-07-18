// app/profile/[id]/page.tsx
"use client"

import { useParams, useRouter } from "next/navigation"
import ProfileCommon from "../_components/ProfileCommon"
import { Suspense, useEffect } from "react"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"

export default function UserProfilePage() {
  const { id } = useParams()

  const router = useRouter()
  const userId = useAppSelector((state: RootState) => state.auth.userId)
  // const { user } = useAuth()

  useEffect(() => {
    if (typeof id === "string" && userId === id) {
      router.replace("/profile") // убираем ID из URL
    }
  }, [id, userId, router])

  if (typeof id !== "string") return <div>Неверный ID</div>

  return (
    <Suspense>
      <ProfileCommon userId={id} />
    </Suspense>
  )
}
