import Link from "next/link"

export default function SearchGames() {
  return (
    <div>
      <h1>Поиск игр</h1>
      <div>Тут поиск игр</div>
      <Link href="/games/zombicide">Отмена</Link>
    </div>
  )
}
