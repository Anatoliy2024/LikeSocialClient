// app/(protected)/layout.tsx

import { serverAuthAPI } from "@/api/serverApi"
import { redirect } from "next/navigation"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const res = await serverAuthAPI.check()
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
  //     method: "GET",
  //     headers: {
  //       // Можно добавить, если нужно
  //       "Content-Type": "application/json",
  //     },
  //     credentials: "include", // чтобы отправлять cookie (refreshToken)
  //     cache: "no-store", // чтобы всегда свежие данные
  //   })
  console.log("res serverAuthAPI", res)
  if (!res.ok) {
    redirect("/register") // если не авторизован
  }

  const user = await res.json()

  if (!user.isVerified) {
    redirect("/verify")
  }

  return (
    <>
      {/* здесь можешь добавить Header, Navbar и т.д. */}
      {children}
    </>
  )
}
