"use client"
import { Provider } from "react-redux"
import { store } from "@/store/store"
// // import Header from "@/components/header/Header"
// import Navbar from "@/components/navbar/Navbar"
// // import Footer from "@/components/footer/Footer"
// import HeaderContainer from "@/components/header/HeaderContainer"
// import AuthProvider from "./AuthProvider"
// import { useEffect } from "react"

// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { getStatusServerThunk } from "@/store/thunks/serverThunk"
// import { ServerType } from '@/store/slices/serverSlice'
import InnerApp from "./InnerApp"

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // const dispatch = useAppDispatch()
  // const server = useAppSelector((state: RootState) => state.server) as ServerType
  // useEffect(() => {
  //   dispatch(getStatusServerThunk())
  // }, [dispatch])

  // if (server?.loading === true) {
  //   return <div>Сервер просыпается пожалуйста подождите</div>
  // }

  return (
    <Provider store={store}>
      <InnerApp>{children}</InnerApp>
      {/* <AuthProvider>
          <div className="containerMain">
            <HeaderContainer />
            <Navbar />
            <div className="content">{children}</div>
          
          </div>
        </AuthProvider> */}
    </Provider>
  )
}
