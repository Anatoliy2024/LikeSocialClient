// app/games/zombicide/game/[roomId]/page.tsx
"use client"
import { useAppSelector } from "@/store/hooks"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function GamePage({ params }: { params: { gameId: string } }) {
  const router = useRouter()
  const currentRoom = useAppSelector(
    (state) => state.zombicideSlice.currentRoom,
  )
  const activeGame = useAppSelector((state) => state.zombicideSlice.activeGame)

  useEffect(() => {
    // 🔴 Если игра ещё не началась — редирект в лобби
    if (currentRoom?.status === "waiting" && !activeGame) {
      router.push(`/games/zombicide/lobby/${params.gameId}`)
    }
  }, [currentRoom?.status, activeGame, router, params.gameId])

  if (!activeGame && currentRoom?.status !== "in_progress") {
    return <div>Ожидание начала игры...</div>
  }

  return (
    <div>
      <h1>Игра: {currentRoom?.name}</h1>
      {/* Карта, игроки, зомби, действия */}
      {/* <GameBoard gameState={activeGame} /> */}
    </div>
  )
}
