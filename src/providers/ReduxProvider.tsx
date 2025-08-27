"use client"
import { Provider } from "react-redux"
import { store } from "@/store/store"

import InnerApp from "./InnerApp"
import { CallProvider } from "./CallContext"

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Provider store={store}>
      <CallProvider>
        <InnerApp>{children}</InnerApp>
      </CallProvider>
    </Provider>
  )
}
