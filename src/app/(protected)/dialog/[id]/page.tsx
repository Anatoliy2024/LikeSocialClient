import { MessageBlock } from "@/components/MessageBlock/MessageBlock"
import { Suspense } from "react"

export default function Dialog() {
  return (
    <Suspense>
      <MessageBlock />
    </Suspense>
  )
}
