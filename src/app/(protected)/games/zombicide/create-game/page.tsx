import Link from "next/link"

export default function CreateGame() {
  return (
    <div>
      <h1>Создание игры</h1>
      <div>Тут настройки игры</div>
      <Link href="/games/zombicide">Отмена</Link>
    </div>
  )
}
