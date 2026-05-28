import { MessageType } from "@/types/conversation.types"
import { RefObject, SetStateAction, useEffect, useLayoutEffect } from "react"

export const useScrollManagement = (
  restoreScrollRef: RefObject<{
    top: number
    height: number
  } | null>,
  messages: MessageType[],
  messagesContainerRef: RefObject<HTMLDivElement | null>,
  setIsAtBottom: (value: SetStateAction<boolean>) => void,
  isAtBottomRef: RefObject<boolean>,
  fullImage: string | null,
) => {
  useLayoutEffect(() => {
    if (!restoreScrollRef.current || messages.length === 0) return
    const container = messagesContainerRef.current
    if (!container) return

    const { top: prevTop, height: prevHeight } = restoreScrollRef.current
    const newHeight = container.scrollHeight
    // const newHeight = document.documentElement.scrollHeight
    const diff = newHeight - prevHeight

    if (diff !== 0) {
      container.scrollTop = prevTop + diff
      // document.documentElement.scrollTop = prevTop + diff
    }

    restoreScrollRef.current = null
  }, [messages]) // 🔥 Зависимость от messages — ключевой момент!

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScrollEvent = () => {
      // Ваша логика проверки скролла
      const threshold = 100
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        threshold

      //   console.log("📍 Scroll:", { atBottom, timestamp: Date.now() })

      //   // В messageHandler внутри useSocketHandlers
      //   console.log("📩 Socket message received:", {
      //     isAtBottomRef: isAtBottomRef.current,
      //     timestamp: Date.now(),
      //   })

      setIsAtBottom(atBottom)
      isAtBottomRef.current = atBottom
    }

    container.addEventListener("scroll", handleScrollEvent, { passive: true })

    // Функция очистки (cleanup) — обязательно!
    return () => {
      container.removeEventListener("scroll", handleScrollEvent)
    }
  }, [messages, setIsAtBottom, isAtBottomRef])

  useEffect(() => {
    document.body.style.overflow = fullImage ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [fullImage])
}
