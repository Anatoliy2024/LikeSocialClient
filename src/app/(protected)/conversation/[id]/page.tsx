import { MessageBlock } from "@/components/MessageBlock/MessageBlock"
import { Suspense } from "react"

export default function Conversation() {
  return (
    <Suspense>
      <MessageBlock />
    </Suspense>
  )
}
