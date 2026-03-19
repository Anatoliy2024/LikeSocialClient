import React, { createContext, useContext } from "react"
import { useCall } from "../hooks/useCall"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"

type CallContextType = ReturnType<typeof useCall>

const CallContext = createContext<CallContextType | null>(null)

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const userId = useAppSelector((state: RootState) => state.auth.userId)
  const call = useCall(userId)

  return <CallContext.Provider value={call}>{children}</CallContext.Provider>
}

export const useCallContext = () => {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error("useCallContext must be used inside CallProvider")
  return ctx
}
