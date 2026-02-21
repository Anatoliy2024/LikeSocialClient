"use client"
import { ConversationsBlock } from "@/components/ConversationsBlock/ConversationsBlock"
import { Suspense } from "react"

export default function Conversations() {
  return (
    <Suspense>
      <ConversationsBlock />
    </Suspense>
  )
}
