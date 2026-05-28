import { AppDispatch } from "@/store/store"
import { fetchMessagesThunk } from "@/store/thunks/conversationsThunk"
import { RefObject, useCallback, useEffect, useRef } from "react"

export const useLoadOlderMessages = (
  conversationId: string,
  dispatch: AppDispatch,
  hasMoreOlder: boolean,
  loading: boolean,
  oldestMessageId: string | null,
  messagesContainerRef: RefObject<HTMLDivElement | null>,
  restoreScrollRef: RefObject<{
    top: number
    height: number
  } | null>,
  //   topSentinelRef: RefObject<HTMLDivElement | null>,
) => {
  const topSentinelRef = useRef<HTMLDivElement>(null)

  const handleLoadOlder = useCallback(() => {
    if (!hasMoreOlder || loading || !oldestMessageId) return
    const container = messagesContainerRef.current
    if (!container) return
    // Сохраняем ДО диспатча
    restoreScrollRef.current = {
      top: container.scrollTop,
      height: container.scrollHeight,
    }

    // Без await — просто запускаем, useLayoutEffect поймает изменение messages
    dispatch(
      fetchMessagesThunk({
        conversationId,
        direction: "older",
        cursor: oldestMessageId,
      }),
    )
  }, [hasMoreOlder, loading, oldestMessageId, conversationId, dispatch])

  useEffect(() => {
    if (!hasMoreOlder || !topSentinelRef.current) return
    const container = messagesContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && oldestMessageId) {
          handleLoadOlder()
        }
      },
      {
        root: container,
        threshold: 0.1,
      },
    )

    observer.observe(topSentinelRef.current)
    return () => observer.disconnect()
  }, [hasMoreOlder, oldestMessageId, loading, conversationId, handleLoadOlder])

  return {
    topSentinelRef,
  }
}
