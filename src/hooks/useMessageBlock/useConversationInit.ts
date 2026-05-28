import { clearMessages } from "@/store/slices/conversationsSlice"
import { AppDispatch } from "@/store/store"
import { fetchMessagesThunk } from "@/store/thunks/conversationsThunk"
import { RefObject, useEffect, useRef } from "react"

type ConversationInitType = {
  conversationId: string
  dispatch: AppDispatch
  initialScrollDoneRef: RefObject<boolean>
  initialLastReadIdRef: RefObject<string | null | undefined>
}

export const useConversationInit = ({
  conversationId,
  dispatch,
  initialScrollDoneRef,
  initialLastReadIdRef,
}: ConversationInitType) => {
  const initializedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!conversationId) return
    if (initializedIdRef.current === conversationId) return

    initializedIdRef.current = conversationId
    initialScrollDoneRef.current = false
    initialLastReadIdRef.current = undefined

    dispatch(clearMessages())
    dispatch(fetchMessagesThunk({ conversationId, direction: "initial" }))

    return () => {
      initializedIdRef.current = null
    }
  }, [conversationId, dispatch])
}
