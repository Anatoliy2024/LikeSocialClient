"use client"
import { useEffect } from "react"
import style from "./Maps.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { deleteMapThunk, fetchMapsThunk } from "@/store/thunks/zombicideThunks"
import Link from "next/link"
import { Paginator } from "@/components/Paginator/Paginator"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function MapsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const maps = useAppSelector((state) => state.zombicideSlice.maps)
  const page = useAppSelector((state) => state.zombicideSlice.page)
  const pages = useAppSelector((state) => state.zombicideSlice.pages)
  const userId = useAppSelector((state) => state.auth.userId)

  useEffect(() => {
    if (!userId) return
    dispatch(fetchMapsThunk(page))
  }, [dispatch, userId])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set("page", String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleDeleteMap = (mapId: string) => {
    dispatch(deleteMapThunk(mapId))
  }

  return (
    <div className={style.maps}>
      <h1>Карты</h1>
      <Link href="/games/zombicide">Отмена</Link>
      <ul>
        {maps.map((map) => (
          <li key={map._id}>
            <Link href={`map/${map._id}`}>
              <span>{map.name}</span>
              <span>
                Создатель:
                {map.createdBy.username}
              </span>
              <span>колонок:{map.cols}</span>
              <span>рядов:{map.rows}</span>
              <span
                onClick={(e) => {
                  e.preventDefault()
                  handleDeleteMap(map._id)
                }}
              >
                Удалить
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <Paginator page={page} pages={pages} onPageChange={handlePageChange} />
      )}
    </div>
  )
}
