// app/profile/[id]/page.tsx
"use client"

import { useParams } from "next/navigation"
import MyMoviesPageCommon from "../_components/MyMoviesPageCommon"
import { Suspense } from "react"

export default function UserProfilePage() {
  const { id } = useParams() as { id: string }

  if (typeof id !== "string") return <div>Неверный ID</div>

  return (
    <Suspense>
      <MyMoviesPageCommon userId={id} />
    </Suspense>
  )
}
