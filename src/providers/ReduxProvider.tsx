"use client"
import { Provider } from "react-redux"
import { store } from "@/store/store"
// import Header from "@/components/header/Header"
import Navbar from "@/components/navbar/Navbar"
// import Footer from "@/components/footer/Footer"
import HeaderContainer from "@/components/header/HeaderContainer"
import AuthProvider from "./AuthProvider"

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <div className="containerMain">
          <HeaderContainer />
          <Navbar />
          <div className="content">{children}</div>
          {/* <Footer /> */}
        </div>
      </AuthProvider>
    </Provider>
  )
}
