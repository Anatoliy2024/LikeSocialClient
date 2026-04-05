"use client"
import { MapView } from "@/components/MapView/MapView"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchMapByIdThunk } from "@/store/thunks/zombicideThunks"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect } from "react"
import style from "./Map.module.scss"
import { clearCurrentMap } from "@/store/slices/zombicideSlice"
export default function Map() {
  const dispatch = useAppDispatch()
  const cols = useAppSelector((state) => state.zombicideSlice.currentMap?.cols)
  const rows = useAppSelector((state) => state.zombicideSlice.currentMap?.rows)
  const hEdges = useAppSelector(
    (state) => state.zombicideSlice.currentMap?.hEdges,
  )
  const vEdges = useAppSelector(
    (state) => state.zombicideSlice.currentMap?.vEdges,
  )
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

  useEffect(() => {
    return () => {
      dispatch(clearCurrentMap())
    }
  }, [dispatch])

  if (!cols || !rows || !cells || !hEdges || !vEdges)
    return <div>...Загрузка</div>

  return (
    <div className={style.map}>
      <div>Название карты: {name}</div>
      <Link href="/games/zombicide/maps">Отмена</Link>
      <MapView
        cols={cols}
        rows={rows}
        cells={cells}
        hEdges={hEdges}
        vEdges={vEdges}
      />
    </div>
  )
}
