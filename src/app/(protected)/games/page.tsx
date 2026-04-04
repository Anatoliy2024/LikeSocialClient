import Link from "next/link"
import style from "./Games.module.scss"
export default function Games() {
  return (
    <div className={style.games}>
      <h1>Игры</h1>
      <ul>
        <li>
          <Link href="/games/zombicide">Zombicide</Link>
        </li>
      </ul>
    </div>
  )
}
