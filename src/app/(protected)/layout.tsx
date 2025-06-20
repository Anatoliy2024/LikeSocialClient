// app/(protected)/layout.tsx

import { serverAuthAPI } from "@/api/serverApi"
import { redirect } from "next/navigation"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const res = await serverAuthAPI.check()

  console.log("res serverAuthAPI", res)
  if (!res.ok) {
    console.log("/register")
    redirect("/register") // если не авторизован
  }

  const user = await res.json()

  if (!user.isVerified) {
    console.log("/verify")

    redirect("/verify")
  }

  return <>{children}</>
}
