"use client"
import { useEffect } from "react"

// import { logout } from "@/store/slices/authSlice"

import { authCheckThunk, logoutThunk } from "@/store/thunks/authThunk"
import { useAppDispatch } from "@/store/hooks"

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        dispatch(authCheckThunk())
      } catch {
        dispatch(logoutThunk())
      }
    }
    fetchUser()
  }, [])

  return <>{children}</>
}
