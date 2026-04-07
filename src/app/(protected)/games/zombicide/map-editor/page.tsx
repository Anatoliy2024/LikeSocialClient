// src/features/map-editor/MapEditor.tsx
"use client"
import Link from "next/link"
import style from "./map-editor.module.scss"
import { useState, useCallback, memo } from "react"
import { floorColor, floorImage } from "@/utils/floorImage"
import { createEmptyHEdges, createEmptyVEdges, setEdge } from "@/utils/edges"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { saveMapThunk } from "@/store/thunks/zombicideThunks"
import { Cell, CellType, EdgeType, GameMap } from "@/types/zombicide"

type ToolType = "floor" | "separator" | "clear" | null
type SeparatorType = "wall" | "door"

const CELL = 80
const EDGE = 14

// ===== Хелперы для 2D-сетки =====
const createEmptyGrid = (rows: number, cols: number): Cell[][] =>
  Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map((): Cell => ({ type: "empty" })),
    )

const updateCellInGrid = (
  grid: Cell[][],
  row: number,
  col: number,
  updater: (cell: Cell) => Cell,
): Cell[][] =>
  grid.map((r, ri) =>
    ri === row ? r.map((c, ci) => (ci === col ? updater(c) : c)) : r,
  )

// ===== Мемоизированные компоненты =====
const MapCell = memo(function MapCell({
  cell,
  onClick,
  isActiveTool,
}: {
  cell: Cell
  onClick: () => void
  isActiveTool: boolean
}) {
  return (
    <div
      className={style.mapEditor__mapItem}
      style={{
        width: CELL,
        height: CELL,
        backgroundColor: floorColor[cell.type] ?? "transparent",
        backgroundImage: floorImage[cell.type],
        backgroundSize: "cover",
        backgroundPosition: "center",
        cursor: isActiveTool ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      {cell.type !== "empty" ? cell.type : ""}
    </div>
  )
})

const Edge = memo(function Edge({
  value,
  dir,
  isActive,
  onClick,
}: {
  value: EdgeType
  dir: "h" | "v"
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div
      className={`${style.mapEditor__edge} ${isActive ? style["mapEditor__edge--active"] : ""}`}
      style={{
        width: dir === "v" ? EDGE : "100%",
        height: dir === "h" ? EDGE : "100%",
        cursor: isActive ? "pointer" : "default",
        background:
          value === "wall"
            ? "#444"
            : value === "door"
              ? "#c8a227"
              : "transparent",
        borderRadius: 2,
        transition: "background 0.15s",
      }}
      onClick={onClick}
    />
  )
})

// ===== Основной компонент =====
export default function MapEditor() {
  const dispatch = useAppDispatch()
  const status = useAppSelector((state) => state.zombicideSlice.status)

  const [mapName, setMapName] = useState("")
  const [rowsInput, setRowsInput] = useState(5)
  const [colsInput, setColsInput] = useState(6)
  const [appliedRows, setAppliedRows] = useState(0)
  const [appliedCols, setAppliedCols] = useState(0)

  // ✅ 2D-структуры везде — без конвертации в flat
  const [grid, setGrid] = useState<Cell[][]>([])
  const [hEdges, setHEdges] = useState<EdgeType[][]>([])
  const [vEdges, setVEdges] = useState<EdgeType[][]>([])

  const [tool, setTool] = useState<ToolType>(null)
  const [floorType, setFloorType] = useState<CellType>("room")
  const [separatorType, setSeparatorType] = useState<SeparatorType>("wall")

  // ===== Обработчики =====
  const handleCreate = useCallback(() => {
    const c = Math.min(Math.max(colsInput, 6), 20)
    const r = Math.min(Math.max(rowsInput, 5), 20)

    setColsInput(c)
    setRowsInput(r)
    setAppliedCols(c)
    setAppliedRows(r)
    setGrid(createEmptyGrid(r, c))
    setHEdges(createEmptyHEdges(r, c))
    setVEdges(createEmptyVEdges(r, c))
  }, [colsInput, rowsInput])

  const handleSaveMap = useCallback(() => {
    if (!mapName.trim() || grid.length === 0) return

    // Валидация: минимум вход и выход
    const hasEntrance = grid.some((row) =>
      row.some((cell) => cell.type === "entrance"),
    )
    const hasExit = grid.some((row) => row.some((cell) => cell.type === "exit"))

    if (!hasEntrance || !hasExit) {
      alert("Карта должна содержать хотя бы один вход и один выход!")
      return
    }

    // ✅ Отправляем 2D-структуры как есть — без конвертации в flat
    const payload: Omit<GameMap, "_id" | "createdBy" | "createdAt"> = {
      name: mapName.trim(),
      cols: appliedCols,
      rows: appliedRows,
      cells: grid, // ✅ 2D: Cell[][]
      hEdges, // ✅ 2D: EdgeType[][]
      vEdges, // ✅ 2D: EdgeType[][]
    }

    dispatch(saveMapThunk(payload))
  }, [mapName, grid, hEdges, vEdges, appliedCols, appliedRows, dispatch])

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (tool === "floor") {
        setGrid((prev) =>
          updateCellInGrid(prev, row, col, () => ({ type: floorType })),
        )
      } else if (tool === "clear") {
        setGrid((prev) =>
          updateCellInGrid(prev, row, col, () => ({ type: "empty" })),
        )

        // Очищаем все 4 ребра клетки
        let { hEdges: h, vEdges: v } = setEdge(
          hEdges,
          vEdges,
          row,
          col,
          "top",
          "none",
        )
        ;({ hEdges: h, vEdges: v } = setEdge(h, v, row, col, "bottom", "none"))
        ;({ hEdges: h, vEdges: v } = setEdge(h, v, row, col, "left", "none"))
        ;({ hEdges: h, vEdges: v } = setEdge(h, v, row, col, "right", "none"))
        setHEdges(h)
        setVEdges(v)
      }
    },
    [tool, floorType, hEdges, vEdges],
  )

  const handleEdgeClick = useCallback(
    (row: number, col: number, dir: "h" | "v") => {
      if (tool !== "separator") return

      if (dir === "h") {
        setHEdges((prev) => {
          const next = prev.map((r) => [...r])
          next[row][col] =
            next[row][col] === separatorType ? "none" : separatorType
          return next
        })
      } else {
        setVEdges((prev) => {
          const next = prev.map((r) => [...r])
          next[row][col] =
            next[row][col] === separatorType ? "none" : separatorType
          return next
        })
      }
    },
    [tool, separatorType],
  )

  // ===== Рендер =====
  return (
    <div className={style.mapEditor}>
      <Link href="/games/zombicide">Отмена</Link>

      <div className={style.mapEditor__tools}>
        <div>
          <label>Название карты</label>
          <input
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            placeholder="Моя карта"
          />
        </div>
        <div>
          <label>Рядов</label>
          <input
            type="number"
            min={5}
            max={20}
            value={rowsInput}
            onChange={(e) => setRowsInput(+e.target.value)}
          />
        </div>
        <div>
          <label>Колонок</label>
          <input
            type="number"
            min={6}
            max={20}
            value={colsInput}
            onChange={(e) => setColsInput(+e.target.value)}
          />
        </div>
        <button onClick={handleCreate}>Создать каркас</button>
        {status !== "loading" ? (
          <button onClick={handleSaveMap}>Сохранить карту</button>
        ) : (
          <button disabled>Загрузка...</button>
        )}
      </div>

      <div className={style.mapEditor__toolBar}>
        <div>
          <label>Пол</label>
          <select
            onChange={(e) => {
              setTool("floor")
              setFloorType(e.target.value as CellType)
            }}
            value={floorType}
          >
            <option value="room">Комната</option>
            <option value="street">Улица</option>
            <option value="spawn">Спаун</option>
            <option value="entrance">Вход</option>
            <option value="exit">Выход</option>
            <option value="empty">Пусто</option>
          </select>
        </div>
        <div>
          <label>Разделитель</label>
          <select
            onChange={(e) => {
              setTool("separator")
              setSeparatorType(e.target.value as SeparatorType)
            }}
            value={separatorType}
          >
            <option value="wall">Стена</option>
            <option value="door">Дверь</option>
          </select>
        </div>

        <div className={style.mapEditor__toolActiveWrapper}>
          {(["floor", "separator", "clear"] as ToolType[]).map((t) => (
            <span
              key={t}
              onClick={() => setTool(t)}
              className={tool === t ? style.mapEditor__toolActive : ""}
            >
              {t === "floor"
                ? "Пол"
                : t === "separator"
                  ? "Разделитель"
                  : "Очистить"}
            </span>
          ))}
        </div>
      </div>

      {grid.length > 0 && (
        <div
          className={style.mapEditor__map}
          style={{
            display: "grid",
            gridTemplateColumns: `${EDGE}px repeat(${appliedCols}, ${CELL}px ${EDGE}px)`,
            gridTemplateRows: `${EDGE}px repeat(${appliedRows}, ${CELL}px ${EDGE}px)`,
          }}
        >
          {Array.from({ length: appliedRows * 2 + 1 }, (_, rowIdx) => {
            const isHRow = rowIdx % 2 === 0
            const row = Math.floor(rowIdx / 2)

            return Array.from({ length: appliedCols * 2 + 1 }, (_, colIdx) => {
              const isVCol = colIdx % 2 === 0
              const col = Math.floor(colIdx / 2)
              const key = `${rowIdx}-${colIdx}`

              // Угол
              if (isHRow && isVCol) {
                return <div key={key} style={{ width: EDGE, height: EDGE }} />
              }

              // Горизонтальное ребро
              if (isHRow) {
                const isOuter = row === 0 || row === appliedRows
                if (isOuter || col >= appliedCols) {
                  return (
                    <div key={key} style={{ width: "100%", height: EDGE }} />
                  )
                }
                const value = hEdges[row]?.[col] ?? "none"
                return (
                  <Edge
                    key={key}
                    value={value}
                    dir="h"
                    isActive={tool === "separator"}
                    onClick={() => handleEdgeClick(row, col, "h")}
                  />
                )
              }

              // Вертикальное ребро
              if (isVCol) {
                const isOuter = col === 0 || col === appliedCols
                if (isOuter || row >= appliedRows) {
                  return <div key={key} style={{ width: EDGE, height: CELL }} />
                }
                const value = vEdges[row]?.[col] ?? "none"
                return (
                  <Edge
                    key={key}
                    value={value}
                    dir="v"
                    isActive={tool === "separator"}
                    onClick={() => handleEdgeClick(row, col, "v")}
                  />
                )
              }

              // Клетка
              const cell = grid[row]?.[col]
              if (!cell) return <div key={key} />

              return (
                <MapCell
                  key={key}
                  cell={cell}
                  onClick={() => handleCellClick(row, col)}
                  isActiveTool={tool === "floor" || tool === "clear"}
                />
              )
            })
          })}
        </div>
      )}
    </div>
  )
}

// "use client"
// import Link from "next/link"
// import style from "./map-editor.module.scss"
// import { useState } from "react"
// import { floorColor, floorImage } from "@/utils/floorImage"
// import { createEmptyHEdges, createEmptyVEdges, setEdge } from "@/utils/edges"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { saveMapThunk } from "@/store/thunks/zombicideThunks"
// import { Cell, CellType, EdgeType } from "@/types/zombicide"

// type ToolType = "floor" | "separator" | "clear" | null
// type SeparatorType = "wall" | "door"

// const CELL = 80
// const EDGE = 14

// const emptyCell = (): Cell => ({ type: "empty" })

// export default function MapEditor() {
//   const dispatch = useAppDispatch()
//   const status = useAppSelector((state) => state.zombicideSlice.status)
//   const [mapName, setMapName] = useState("")
//   const [cols, setCols] = useState(6)
//   const [rows, setRows] = useState(5)
//   const [appliedCols, setAppliedCols] = useState(0)
//   const [appliedRows, setAppliedRows] = useState(0)

//   const [grid, setGrid] = useState<Cell[]>([])
//   const [hEdges, setHEdges] = useState<EdgeType[][]>([])
//   const [vEdges, setVEdges] = useState<EdgeType[][]>([])

//   const [tool, setTool] = useState<ToolType>(null)
//   const [floor, setFloor] = useState<CellType>("room")
//   const [separator, setSeparator] = useState<SeparatorType>("wall")

//   const handleCreate = () => {
//     const c = Math.min(Math.max(cols, 6), 15)
//     const r = Math.min(Math.max(rows, 5), 15)
//     setCols(c)
//     setRows(r)
//     setAppliedCols(c)
//     setAppliedRows(r)
//     setGrid(
//       Array(c * r)
//         .fill(null)
//         .map(emptyCell),
//     )
//     setHEdges(createEmptyHEdges(r, c))
//     setVEdges(createEmptyVEdges(r, c))
//   }

//   const handleSaveMap = () => {
//     if (!mapName || grid.length === 0) return
//     dispatch(
//       saveMapThunk({
//         name: mapName,
//         cols: appliedCols,
//         rows: appliedRows,
//         cells: grid,
//         hEdges,
//         vEdges,
//       }),
//     )
//   }

//   const handleCellClick = (idx: number) => {
//     if (tool === "floor") {
//       setGrid((prev) => {
//         const next = [...prev]
//         next[idx] = { ...next[idx], type: floor }
//         return next
//       })
//     } else if (tool === "clear") {
//       const row = Math.floor(idx / appliedCols)
//       const col = idx % appliedCols

//       setGrid((prev) => {
//         const next = [...prev]
//         next[idx] = emptyCell()
//         return next
//       })

//       let { hEdges: h, vEdges: v } = setEdge(
//         hEdges,
//         vEdges,
//         row,
//         col,
//         "top",
//         "none",
//       )
//       ;({ hEdges: h, vEdges: v } = setEdge(h, v, row, col, "bottom", "none"))
//       ;({ hEdges: h, vEdges: v } = setEdge(h, v, row, col, "left", "none"))
//       ;({ hEdges: h, vEdges: v } = setEdge(h, v, row, col, "right", "none"))
//       setHEdges(h)
//       setVEdges(v)
//     }
//   }

//   const edgeStyle = (value: EdgeType, dir: "h" | "v") => ({
//     width: dir === "v" ? EDGE : "100%",
//     height: dir === "h" ? EDGE : "100%",
//     cursor: tool === "separator" ? "pointer" : "default",
//     background:
//       value === "wall" ? "#444" : value === "door" ? "#c8a227" : "transparent",
//     borderRadius: 2,
//     transition: "background 0.15s",
//   })

//   // console.log({
//   //   appliedRows,
//   //   appliedCols,
//   //   gridLength: grid.length,
//   //   hEdgesShape: `${hEdges.length} × ${hEdges[0]?.length}`,
//   //   vEdgesShape: `${vEdges.length} × ${vEdges[0]?.length}`,
//   // })

//   return (
//     <div className={style.mapEditor}>
//       <Link href="/games/zombicide">Отмена</Link>

//       <div className={style.mapEditor__tools}>
//         <div>
//           <label>Название карты</label>
//           <input value={mapName} onChange={(e) => setMapName(e.target.value)} />
//         </div>
//         <div>
//           <label>Рядов</label>
//           <input
//             type="number"
//             min={5}
//             max={15}
//             value={rows}
//             onChange={(e) => setRows(+e.target.value)}
//           />
//         </div>
//         <div>
//           <label>Колонок</label>
//           <input
//             type="number"
//             min={6}
//             max={15}
//             value={cols}
//             onChange={(e) => setCols(+e.target.value)}
//           />
//         </div>
//         <button onClick={handleCreate}>Создать каркас</button>
//         {status !== "loading" && (
//           <button onClick={handleSaveMap}>Сохранить карту</button>
//         )}
//         {status === "loading" && <button>Загрузка</button>}
//       </div>

//       <div className={style.mapEditor__toolBar}>
//         <div>
//           <label>Пол</label>
//           <select
//             onChange={(e) => {
//               setTool("floor")
//               setFloor(e.target.value as CellType)
//             }}
//           >
//             <option value="room">Комната</option>
//             <option value="street">Улица</option>
//             <option value="spawn">Спаун</option>
//             <option value="entrance">Вход</option>
//             <option value="exit">Выход</option>
//             <option value="empty">Пусто</option>
//           </select>
//         </div>
//         <div>
//           <label>Разделитель</label>
//           <select
//             onChange={(e) => {
//               setTool("separator")
//               setSeparator(e.target.value as SeparatorType)
//             }}
//           >
//             <option value="wall">Стена</option>
//             <option value="door">Дверь</option>
//           </select>
//         </div>

//         <div className={style.mapEditor__toolActiveWrapper}>
//           {(["floor", "separator", "clear"] as ToolType[]).map((t) => (
//             <span
//               key={t}
//               onClick={() => setTool(t)}
//               className={tool === t ? style.mapEditor__toolActive : ""}
//             >
//               {t === "floor"
//                 ? "Пол"
//                 : t === "separator"
//                   ? "Разделитель"
//                   : "Очистить"}
//             </span>
//           ))}
//         </div>
//       </div>

//       {grid.length > 0 && (
//         <div
//           className={style.mapEditor__map}
//           style={{
//             display: "grid",
//             // gridTemplateColumns: `repeat(${appliedCols}, ${EDGE}px ${CELL}px) ${EDGE}px`,
//             gridTemplateColumns: `${EDGE}px repeat(${appliedCols}, ${CELL}px ${EDGE}px)`,
//             gridTemplateRows: `${EDGE}px repeat(${appliedRows}, ${CELL}px ${EDGE}px)`,

//             // gridTemplateColumns:
//             //   `${EDGE}px ` + `repeat(${appliedCols}, ${CELL}px ${EDGE}px)`,
//           }}
//         >
//           {Array.from({ length: appliedRows * 2 + 1 }, (_, rowIdx) => {
//             const isHRow = rowIdx % 2 === 0 // чётная строка = горизонтальные грани
//             const row = Math.floor(rowIdx / 2) // 0,0,1,1,2,2...

//             return Array.from({ length: appliedCols * 2 + 1 }, (_, colIdx) => {
//               const isVCol = colIdx % 2 === 0 // чётная колонка = вертикальные грани
//               const col = Math.floor(colIdx / 2)
//               const key = `${rowIdx}-${colIdx}`

//               // угол
//               if (isHRow && isVCol) {
//                 return <div key={key} style={{ width: EDGE, height: EDGE }} />
//               }

//               // горизонтальная грань
//               if (isHRow) {
//                 const isOuterEdge = row === 0 || row === appliedRows
//                 if (isOuterEdge)
//                   return (
//                     <div key={key} style={{ width: "100%", height: EDGE }} />
//                   )

//                 const hCol = col // индекс клетки под/над гранью
//                 if (hCol >= appliedCols)
//                   return <div key={key} style={{ width: EDGE, height: EDGE }} />
//                 const value: EdgeType = hEdges[row]?.[hCol] ?? "none"
//                 return (
//                   <div
//                     key={key}
//                     style={edgeStyle(value, "h")}
//                     onClick={() => {
//                       if (tool !== "separator") return
//                       const newH = hEdges.map((r) => [...r])
//                       newH[row][hCol] =
//                         hEdges[row][hCol] === separator
//                           ? "none"
//                           : (separator as EdgeType)
//                       setHEdges(newH)
//                     }}
//                     // onClick={() => {
//                     //   if (tool !== "separator") return
//                     //   const current = hEdges[row][hCol]
//                     //   const { hEdges: h, vEdges: v } = setEdge(
//                     //     hEdges,
//                     //     vEdges,
//                     //     row,
//                     //     hCol,
//                     //     "bottom",
//                     //     current === separator
//                     //       ? "none"
//                     //       : (separator as EdgeType),
//                     //   )
//                     //   setHEdges(h)
//                     //   setVEdges(v)
//                     // }}
//                   />
//                 )
//               }

//               // вертикальная грань
//               if (isVCol) {
//                 const isOuterEdge = col === 0 || col === appliedCols
//                 if (isOuterEdge)
//                   return <div key={key} style={{ width: EDGE, height: CELL }} />

//                 const vRow = row // ← без -1
//                 if (vRow >= appliedRows)
//                   return <div key={key} style={{ width: EDGE, height: CELL }} />
//                 const value: EdgeType = vEdges[vRow]?.[col] ?? "none"
//                 return (
//                   <div
//                     key={key}
//                     className={`${style.mapEditor__edge} ${tool === "separator" ? style["mapEditor__edge--active"] : ""}`}
//                     style={edgeStyle(value, "v")}
//                     onClick={() => {
//                       if (tool !== "separator") return
//                       const newV = vEdges.map((r) => [...r])
//                       newV[vRow][col] =
//                         vEdges[vRow][col] === separator
//                           ? "none"
//                           : (separator as EdgeType)
//                       setVEdges(newV)
//                     }}
//                     // onClick={() => {
//                     //   if (tool !== "separator") return
//                     //   const current = vEdges[vRow][col]
//                     //   const { hEdges: h, vEdges: v } = setEdge(
//                     //     hEdges,
//                     //     vEdges,
//                     //     vRow,
//                     //     col,
//                     //     "right",
//                     //     current === separator
//                     //       ? "none"
//                     //       : (separator as EdgeType),
//                     //   )
//                     //   setHEdges(h)
//                     //   setVEdges(v)
//                     // }}
//                   />
//                 )
//               }

//               // клетка
//               const cellRow = row
//               const cellCol = col
//               const cellIdx = cellRow * appliedCols + cellCol
//               const cell = grid[cellIdx]
//               if (!cell) return <div key={key} />

//               return (
//                 <div
//                   key={key}
//                   className={style.mapEditor__mapItem}
//                   style={{
//                     width: CELL,
//                     height: CELL,
//                     backgroundColor: floorColor[cell.type],
//                     backgroundImage: floorImage[cell.type],
//                     backgroundSize: "cover",
//                     backgroundPosition: "center",
//                     cursor:
//                       tool === "floor" || tool === "clear"
//                         ? "pointer"
//                         : "default",
//                   }}
//                   onClick={() => handleCellClick(cellIdx)}
//                 >
//                   {cell.type !== "empty" ? cell.type : ""}
//                 </div>
//               )
//             })
//           })}
//         </div>
//       )}
//     </div>
//   )
// }
