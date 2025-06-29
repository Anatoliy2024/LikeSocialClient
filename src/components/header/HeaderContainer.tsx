"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import Header from "./Header"
import { RootState } from "@/store/store"
// import { logout } from "@/store/slices/authSlice"
import { useRouter } from "next/navigation"
import { logoutThunk } from "@/store/thunks/authThunk"

const HeaderContainer = ({
  handleShowToggleMenu,
  showButton,
  menuOpen,
}: {
  handleShowToggleMenu: () => void
  showButton: boolean
  menuOpen: boolean
}) => {
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const username = useAppSelector((state: RootState) => state.auth.username)
  const avatar = useAppSelector((state: RootState) => state.auth.avatar)
  // const avatar = useAppSelector((state: RootState) => state.profile.avatar)

  const dispatch = useAppDispatch()
  const router = useRouter()
  const logoutButton = () => {
    dispatch(logoutThunk())
    router.push("/")
    localStorage.removeItem("accessToken")
  }

  return (
    <Header
      isAuth={isAuth}
      username={username}
      avatar={avatar ? avatar : ""}
      logoutFn={logoutButton}
      handleShowToggleMenu={handleShowToggleMenu}
      showButton={showButton}
      menuOpen={menuOpen}
    />
  )
}

export default HeaderContainer
