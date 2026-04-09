import Link from "next/link"

export default function GamePage() {
  return (
    <div>
      <div>Игра не найдена</div>
      <Link href="/games/zombicide">Отмена</Link>
    </div>
  )
}
