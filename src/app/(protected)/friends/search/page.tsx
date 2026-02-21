"use client"

import { SearchBlock } from "@/components/searchBlock/SearchBlock"
import { Suspense } from "react"

export default function SearchFriends() {
  return (
    <Suspense>
      <SearchBlock />
    </Suspense>
  )
}
