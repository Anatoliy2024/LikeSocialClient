"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authAPI } from "@/api/authAPI"
// import { authAPI } from "@/api/api"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        router.push("/auth")
      })
  }, [router])

  return <>{children}</>
}
