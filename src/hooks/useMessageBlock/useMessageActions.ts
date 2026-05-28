import { useCallback } from "react"
import { Socket } from "socket.io-client"

type UseMessageActionsProps = {
  socket: Socket | null
  onActionComplete?: () => void // 🔹 Опциональный колбэк для UI
}

export const useMessageActions = ({
  socket,
  onActionComplete,
}: UseMessageActionsProps) => {
  const handleReaction = useCallback(
    (
      messageId: string,
      reactionId: string,
      // currentMessage: string,
      // setCurrentMessage: Dispatch<SetStateAction<string | null>>,
    ) => {
      if (!socket) return
      socket.emit("message:reaction", { messageId, reactionId })
      onActionComplete?.()
      // if (currentMessage === messageId) setCurrentMessage(null)
    },
    [socket, onActionComplete],
  )

  const handleDeleteMessage = (messageId: string) => {
    if (!socket) return

    socket.emit("messages:delete", {
      messageId,
    })
    onActionComplete?.()
  }

  //   const handleReaction =useCallback((
  //     messageId: string,
  //     reactionId: string,
  //     // currentMessage: string,
  //     // setCurrentMessage: Dispatch<SetStateAction<string | null>>,
  //   ) => {
  //     if (!socket) return
  //     socket.emit("message:reaction", { messageId, reactionId })
  //     onActionComplete?.()
  //     // if (currentMessage === messageId) setCurrentMessage(null)
  //   },[socket,onActionComplete])

  return {
    handleReaction,
    handleDeleteMessage,
  }
}
