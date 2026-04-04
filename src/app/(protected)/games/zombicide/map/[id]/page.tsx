"use client"
import { MapView } from "@/components/MapView/MapView"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchMapByIdThunk } from "@/store/thunks/zombicideThunks"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect } from "react"
import style from "./Map.module.scss"
export default function Map() {
  const dispatch = useAppDispatch()
  const cols = useAppSelector((state) => state.zombicideSlice.currentMap?.cols)
  const rows = useAppSelector((state) => state.zombicideSlice.currentMap?.rows)
  const cells = useAppSelector(
    (state) => state.zombicideSlice.currentMap?.cells,
  )
  const name = useAppSelector((state) => state.zombicideSlice.currentMap?.name)
  console.log("cells", cells)
  const params = useParams<{ id: string }>()
  if (!params || !params.id) throw new Error("Параметр id не найден")
  const id = params.id

  useEffect(() => {
    dispatch(fetchMapByIdThunk(id))
  }, [dispatch, id])
  if (!cols || !rows || !cells) return <div>...Загрузка</div>

  return (
    <div className={style.map}>
      <div>Название карты: {name}</div>
      <Link href="/games/zombicide/maps">Отмена</Link>
      <MapView cols={cols} rows={rows} cells={cells} />
    </div>
  )
}
