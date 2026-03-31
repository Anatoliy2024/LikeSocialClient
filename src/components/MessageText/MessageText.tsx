// MessageText.tsx
import { useMemo } from "react"
import { parseMessage } from "../parseMessage/parseMessage"

export const MessageText = ({ text }: { text: string }) => {
  const parsed = useMemo(() => parseMessage(text), [text])
  return <>{parsed}</>
}
