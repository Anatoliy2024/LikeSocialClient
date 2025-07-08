"use client"
import { Suspense } from "react"
import MyMoviesPageCommon from "./_components/MyMoviesPageCommon"

export default function MyMoviesPage() {
  return (
    <Suspense>
      <MyMoviesPageCommon myMoviesPage />
    </Suspense>
  )
}
