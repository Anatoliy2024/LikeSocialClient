// app/games/zombicide/lobby/[roomId]/page.tsx
"use client"
import { useAppSelector } from "@/store/hooks"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LobbyPage({ params }: { params: { lobbyId: string } }) {
  const router = useRouter()
  const currentRoom = useAppSelector(
    (state) => state.zombicideSlice.currentRoom,
  )
  const activeGame = useAppSelector((state) => state.zombicideSlice.activeGame)

  useEffect(() => {
    // 🟡 Если игра уже началась — редирект на страницу игры
    if (currentRoom?.status === "in_progress" || activeGame) {
      router.push(`/games/zombicide/game/${params.lobbyId}`)
    }
  }, [currentRoom?.status, activeGame, router, params.lobbyId])

  if (currentRoom?.status === "in_progress") {
    return <div>Переход к игре...</div>
  }

  return (
    <div>
      <h1>Лобби: {currentRoom?.name}</h1>
      {/* Список игроков, кнопка "Готов", чат */}
      {/* <LobbyRoom room={currentRoom} /> */}
    </div>
  )
}
