import React, { createContext, useContext } from "react"
import { useGroupCall } from "../hooks/useGroupCall"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"

type GroupCallContextType = ReturnType<typeof useGroupCall>

const GroupCallContext = createContext<GroupCallContextType | null>(null)

export const GroupCallProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const userId = useAppSelector((state: RootState) => state.auth.userId)
  const call = useGroupCall(userId)

  return (
    <GroupCallContext.Provider value={call}>
      {children}
    </GroupCallContext.Provider>
  )
}

export const useGroupCallContext = () => {
  const ctx = useContext(GroupCallContext)
  if (!ctx)
    throw new Error("useGroupCallContext must be used inside GroupCallProvider")
  return ctx
}
