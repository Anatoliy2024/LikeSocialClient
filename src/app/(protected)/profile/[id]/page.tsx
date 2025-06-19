// app/profile/[id]/page.tsx
"use client"

import { useParams } from "next/navigation"
import ProfileCommon from "../_components/ProfileCommon"

export default function UserProfilePage() {
  const { id } = useParams()

  if (typeof id !== "string") return <div>Неверный ID</div>

  return <ProfileCommon userId={id} />
}
