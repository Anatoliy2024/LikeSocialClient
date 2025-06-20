"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import Header from "./Header"
import { RootState } from "@/store/store"
// import { logout } from "@/store/slices/authSlice"
import { useRouter } from "next/navigation"
import { logoutThunk } from "@/store/thunks/authThunk"

const HeaderContainer = () => {
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const username = useAppSelector((state: RootState) => state.auth.username)
  const avatar = useAppSelector((state: RootState) => state.auth.avatar)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const logoutButton = () => {
    dispatch(logoutThunk())
    router.push("/")
    localStorage.removeItem("accessToken")
    document.cookie = "refreshToken=; Max-Age=0"
  }

  return (
    <Header
      isAuth={isAuth}
      username={username}
      avatar={avatar}
      logoutFn={logoutButton}
    />
  )
}

export default HeaderContainer
