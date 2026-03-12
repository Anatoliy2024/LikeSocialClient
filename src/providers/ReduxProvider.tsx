"use client"
import { Provider } from "react-redux"
import { store } from "@/store/store"

// import NotificationProvider from "./NotificationProvider"
import { SocketProvider } from "./SocketProvider"
// import { CallProvider } from "./CallContext"
// import InnerApp from "./InnerApp"
// import { SoundNotificationListener } from "@/components/SoundNotificationListener/SoundNotificationListener"

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Provider store={store}>
      {/* <CallProvider>
        <InnerApp>{children}</InnerApp>
        <SoundNotificationListener />
      </CallProvider> */}
      <SocketProvider>{children}</SocketProvider>
    </Provider>
    // <Provider store={store}>
    //   {/* <CallProvider>
    //     <InnerApp>{children}</InnerApp>
    //     <SoundNotificationListener />
    //   </CallProvider> */}
    //   <NotificationProvider>{children}</NotificationProvider>
    // </Provider>
  )
}
