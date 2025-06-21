"use client"
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getStatusServerThunk } from "@/store/thunks/serverThunk"
import Navbar from "@/components/navbar/Navbar"
import HeaderContainer from "@/components/header/HeaderContainer"
import AuthProvider from "./AuthProvider"
import { ServerType } from "@/store/slices/serverSlice"

export default function InnerApp({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const server = useAppSelector((state) => state.server) as ServerType

  useEffect(() => {
    dispatch(getStatusServerThunk())
  }, [dispatch])

  if (server?.loading) {
    return <div>Сервер просыпается, пожалуйста подождите...</div>
  }

  if (!server?.statusServer) {
    return <div>Сервер не отвечает...</div>
  }

  return (
    <AuthProvider>
      <div className="containerMain">
        <HeaderContainer />
        <Navbar />
        <div className="content">{children}</div>
      </div>
    </AuthProvider>
  )
}
