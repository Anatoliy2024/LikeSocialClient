"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import style from "./CreateGame.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchMapsThunk } from "@/store/thunks/zombicideThunks"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Paginator } from "@/components/Paginator/Paginator"
export default function CreateGame() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const maps = useAppSelector((state) => state.zombicideSlice.maps)
  const page = useAppSelector((state) => state.zombicideSlice.page)
  const pages = useAppSelector((state) => state.zombicideSlice.pages)
  const userId = useAppSelector((state) => state.auth.userId)

  const [gameName, setGameName] = useState("")
  const [selectMap, setSelectMap] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    dispatch(fetchMapsThunk(page))
  }, [dispatch, userId, page])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set("page", String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleCreateGame = () =>
    // gameName:string,selectMap:string
    {
      // dispatch(createGameThunk({gameName,selectMap}))
    }
  return (
    <div className={style.createGame}>
      <h1>Создание игры</h1>
      <div>
        <input
          type="text"
          id="gameName"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
        />
        <label htmlFor="gameName">Название игры</label>
      </div>
      <div>
        <span>Выбрать карту</span>:
        <select onChange={(e) => setSelectMap(e.target.value)}>
          {maps.map((map) => (
            <option key={map._id} value={map._id}>
              {map.name}
            </option>
          ))}
          {pages > 1 && (
            <Paginator
              page={page}
              pages={pages}
              onPageChange={handlePageChange}
            />
          )}
        </select>
      </div>
      <button onClick={handleCreateGame}>Создать игру</button>
      <Link href="/games/zombicide">Отмена</Link>
    </div>
  )
}
