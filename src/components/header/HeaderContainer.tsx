"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import Header from "./Header"
import { RootState } from "@/store/store"
// import { logout } from "@/store/slices/authSlice"
import { useRouter } from "next/navigation"
import { logoutThunk } from "@/store/thunks/authThunk"
import { useEffect, useState } from "react"
import {
  deleteAllNotificationsThunk,
  fetchNotificationsThunk,
  markAllNotificationsReadThunk,
} from "@/store/thunks/notificationsThunk"
// import throttle from "lodash.throttle"
import { useHideOnScroll } from "@/hooks/useHideOnScroll"
const HeaderContainer = ({
  handleShowToggleMenu,
  showButton,
  menuOpen,
}: {
  handleShowToggleMenu: () => void
  showButton: boolean
  menuOpen: boolean
}) => {
  // const [showHeader, setShowHeader] = useState(true)
  // // const [lastScrollY, setLastScrollY] = useState(0)
  // const lastScrollYRef = useRef(0)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const username = useAppSelector((state: RootState) => state.auth.username)
  const avatar = useAppSelector((state: RootState) => state.auth.avatar)
  // const avatar = useAppSelector((state: RootState) => state.profile.avatar)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifications = useAppSelector(
    (state: RootState) => state.notifications
  )
  useEffect(() => {
    if (isAuth) dispatch(fetchNotificationsThunk())
  }, [dispatch, isAuth])

  const logoutButton = () => {
    dispatch(logoutThunk())
    router.push("/")
    localStorage.removeItem("accessToken")
  }
  const toggleShowNotification = () => {
    setShowNotifications((prev) => !prev)
  }
  const deleteAllNotifications = () => {
    dispatch(deleteAllNotificationsThunk())
  }
  const markAllNotificationsRead = () => {
    dispatch(markAllNotificationsReadThunk())
  }

  const showHeader = useHideOnScroll()

  return (
    <Header
      isAuth={isAuth}
      username={username}
      avatar={avatar ? avatar : ""}
      logoutFn={logoutButton}
      handleShowToggleMenu={handleShowToggleMenu}
      showButton={showButton}
      menuOpen={menuOpen}
      showNotifications={showNotifications}
      toggleShowNotification={toggleShowNotification}
      notifications={notifications}
      deleteAllNotifications={deleteAllNotifications}
      markAllNotificationsRead={markAllNotificationsRead}
      showHeader={showHeader}
      // handleShowNotification={handleShowNotification}
      // handleCloseNotification={handleCloseNotification}
    />
  )
}

export default HeaderContainer
