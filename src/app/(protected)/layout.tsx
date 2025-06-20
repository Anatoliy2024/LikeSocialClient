// app/(protected)/layout.tsx
"use client"
// import { serverAuthAPI } from "@/api/serverApi"
// import { redirect } from "next/navigation"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authAPI } from "@/api/api"
// import { authAPI } from "@/api/userApi"
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const res = await serverAuthAPI.check()

  // console.log("res serverAuthAPI", res)
  // if (!res.ok) {
  //   console.log("/register")
  //   redirect("/register") // если не авторизован
  // }

  // const user = await res.json()

  // if (!user.isVerified) {
  //   console.log("/verify")

  //   redirect("/verify")
  // }
  const router = useRouter()

  useEffect(() => {
    authAPI
      .me()
      .then((user) => {
        if (!user.isVerified) {
          router.push("/verify")
        }
      })
      .catch(() => {
        router.push("/register")
      })
  }, [router])

  return <>{children}</>
}
