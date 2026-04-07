// app/games/zombicide/maps/[id]/Map.tsx
"use client"
import { MapView } from "@/components/MapView/MapView"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  fetchMapByIdThunk,
  deleteMapThunk,
} from "@/store/thunks/zombicideThunks"
import { clearCurrentMap } from "@/store/slices/zombicideSlice"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import style from "./Map.module.scss"

export default function MapPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const userId = useAppSelector((state) => state.auth.userId)
  const currentMap = useAppSelector((state) => state.zombicideSlice.currentMap)
  const status = useAppSelector((state) => state.zombicideSlice.status)
  const error = useAppSelector((state) => state.zombicideSlice.error)

  // const [isDeleting, setIsDeleting] = useState(false)

  const mapId = params?.id
  const isLoading = status === "loading" && !currentMap
  const isError = status === "error"

  // Загрузка карты при маунте
  useEffect(() => {
    if (mapId) {
      dispatch(fetchMapByIdThunk(mapId))
    }
  }, [dispatch, mapId])

  // Очистка при размаунте
  useEffect(() => {
    return () => {
      dispatch(clearCurrentMap())
    }
  }, [dispatch])

  // Обработчик удаления карты
  const handleDelete = async () => {
    if (
      !mapId ||
      !confirm("Удалить эту карту? Это действие нельзя отменить.")
    ) {
      return
    }
    dispatch(deleteMapThunk(mapId))
    router.push("/games/zombicide/maps")
    // setIsDeleting(true)
    // const result = await dispatch(deleteMapThunk(mapId))

    // if (deleteMapThunk.fulfilled.match(result)) {
    // } else {
    //   alert(result.payload || "Не удалось удалить карту")
    //   setIsDeleting(false)
    // }
  }

  // Состояния загрузки / ошибки
  if (isLoading) {
    return (
      <div className={style.map}>
        <Link href="/games/zombicide/maps">← Назад</Link>
        <div className={style.map__loading}>Загрузка карты...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={style.map}>
        <Link href="/games/zombicide/maps">← Назад</Link>
        <div className={style.map__error}>
          ❌ {error || "Не удалось загрузить карту"}
          <button onClick={() => mapId && dispatch(fetchMapByIdThunk(mapId))}>
            Повторить
          </button>
        </div>
      </div>
    )
  }

  if (!currentMap) {
    return (
      <div className={style.map}>
        <Link href="/games/zombicide/maps">← Назад</Link>
        <div>Карта не найдена</div>
      </div>
    )
  }

  // ✅ Деструктуризация: cells уже 2D, никаких конвертаций!
  const { name, cols, rows, cells, hEdges, vEdges, createdBy } = currentMap

  return (
    <div className={style.map}>
      <div className={style.map__header}>
        <Link href="/games/zombicide/maps">← Назад</Link>
        <h2>{name}</h2>
        <div className={style.map__meta}>
          <span>
            {cols}×{rows}
          </span>
          {createdBy?.username && <span>• Автор: {createdBy.username}</span>}
        </div>
      </div>

      <div className={style.map__viewer}>
        <MapView
          cols={cols}
          rows={rows}
          cells={cells} // ✅ 2D: Cell[][]
          hEdges={hEdges} // ✅ 2D
          vEdges={vEdges} // ✅ 2D
          interactive={false} // только просмотр
        />
      </div>
      {createdBy._id === userId && (
        <div className={style.map__actions}>
          <Link
            href={`/games/zombicide/editor?mapId=${currentMap._id}`}
            className={style.map__btn}
          >
            ✏️ Редактировать
          </Link>
          <button onClick={handleDelete} className={style.map__btn}>
            🗑️ Удалить
          </button>
        </div>
      )}
    </div>
  )
}

// "use client"
// import { MapView } from "@/components/MapView/MapView"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { fetchMapByIdThunk } from "@/store/thunks/zombicideThunks"
// import Link from "next/link"
// import { useParams } from "next/navigation"
// import { useEffect } from "react"
// import style from "./Map.module.scss"
// import { clearCurrentMap } from "@/store/slices/zombicideSlice"
// export default function Map() {
//   const dispatch = useAppDispatch()
//   const cols = useAppSelector((state) => state.zombicideSlice.currentMap?.cols)
//   const rows = useAppSelector((state) => state.zombicideSlice.currentMap?.rows)
//   const hEdges = useAppSelector(
//     (state) => state.zombicideSlice.currentMap?.hEdges,
//   )
//   const vEdges = useAppSelector(
//     (state) => state.zombicideSlice.currentMap?.vEdges,
//   )
//   const cells = useAppSelector(
//     (state) => state.zombicideSlice.currentMap?.cells,
//   )
//   const name = useAppSelector((state) => state.zombicideSlice.currentMap?.name)
//   console.log("cells", cells)
//   const params = useParams<{ id: string }>()
//   if (!params || !params.id) throw new Error("Параметр id не найден")
//   const id = params.id

//   useEffect(() => {
//     dispatch(fetchMapByIdThunk(id))
//   }, [dispatch, id])

//   useEffect(() => {
//     return () => {
//       dispatch(clearCurrentMap())
//     }
//   }, [dispatch])

//   if (!cols || !rows || !cells || !hEdges || !vEdges)
//     return <div>...Загрузка</div>

//   return (
//     <div className={style.map}>
//       <div>Название карты: {name}</div>
//       <Link href="/games/zombicide/maps">Отмена</Link>
//       <MapView
//         cols={cols}
//         rows={rows}
//         cells={cells}
//         hEdges={hEdges}
//         vEdges={vEdges}
//       />
//     </div>
//   )
// }
