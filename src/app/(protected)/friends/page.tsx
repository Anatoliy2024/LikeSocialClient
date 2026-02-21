"use client"

import { FriendsBlock } from "@/components/friendsBlock/FriendsBlock"
import { Suspense } from "react"

export default function Friends() {
  return (
    <Suspense>
      <FriendsBlock />
    </Suspense>
  )
}
