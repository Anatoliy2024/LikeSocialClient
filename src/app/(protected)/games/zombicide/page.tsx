import Link from "next/link"
import style from "./Zombicide.module.scss"
export default function Zombicide() {
  return (
    <div className={style.zombicide}>
      <h1>Zombicide</h1>
      <ul>
        <li>
          <Link href="zombicide/create-game">Создать игру</Link>
        </li>
        <li>
          <Link href="zombicide/search-games">Поиск игры</Link>
        </li>
        <li>
          <Link href="zombicide/map-editor">Редактор карт</Link>
        </li>
        <li>
          <Link href="zombicide/maps">Карты</Link>
        </li>
        <li>
          <Link href="/games">Назад</Link>
        </li>
      </ul>
    </div>
  )
}
