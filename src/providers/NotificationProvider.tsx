"use client"

import { useNotification } from "@/hooks/useNotification"
import ReduxProvider from "./ReduxProvider"

export default function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useNotification()

  return <ReduxProvider>{children}</ReduxProvider>
}
