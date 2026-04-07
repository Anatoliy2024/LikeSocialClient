// components/MapView/MapView.tsx
import { Cell, EdgeType } from "@/types/zombicide"
import style from "./MapView.module.scss"
import { floorColor, floorImage } from "@/utils/floorImage"
import { memo } from "react"

const CELL = 80
const EDGE = 14

interface MapViewProps {
  cols: number
  rows: number
  cells: Cell[][] // ✅ 2D: [row][col]
  hEdges: EdgeType[][]
  vEdges: EdgeType[][]
  interactive?: boolean // опционально: можно ли кликать (для редактора)
  onCellClick?: (row: number, col: number) => void
}

// Мемоизированная клетка — меньше перерисовок
const MapCell = memo(function MapCell({
  cell,
  onClick,
}: {
  cell: Cell
  onClick?: () => void
}) {
  return (
    <div
      className={style.mapView__item}
      style={{
        width: CELL,
        height: CELL,
        backgroundColor: floorColor[cell.type] ?? "transparent",
        backgroundImage: floorImage[cell.type],
        backgroundSize: "cover",
        backgroundPosition: "center",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      {cell.type !== "empty" ? cell.type : ""}
    </div>
  )
})

// Мемоизированное ребро
const MapEdge = memo(function MapEdge({
  value,
  dir,
}: {
  value: EdgeType
  dir: "h" | "v"
}) {
  return (
    <div
      style={{
        width: dir === "v" ? EDGE : "100%",
        height: dir === "h" ? EDGE : "100%",
        background:
          value === "wall"
            ? "#444"
            : value === "door"
              ? "#c8a227"
              : "transparent",
        borderRadius: 2,
        transition: "background 0.15s",
      }}
    />
  )
})

export function MapView({
  cols,
  rows,
  cells,
  hEdges,
  vEdges,
  interactive = false,
  onCellClick,
}: MapViewProps) {
  return (
    <div
      className={style.mapView}
      style={{
        display: "grid",
        gridTemplateColumns: `${EDGE}px repeat(${cols}, ${CELL}px ${EDGE}px)`,
        gridTemplateRows: `${EDGE}px repeat(${rows}, ${CELL}px ${EDGE}px)`,
      }}
    >
      {Array.from({ length: rows * 2 + 1 }, (_, rowIdx) => {
        const isHRow = rowIdx % 2 === 0 // чётная = горизонтальные рёбра
        const row = Math.floor(rowIdx / 2)

        return Array.from({ length: cols * 2 + 1 }, (_, colIdx) => {
          const isVCol = colIdx % 2 === 0 // чётная = вертикальные рёбра
          const col = Math.floor(colIdx / 2)
          const key = `${rowIdx}-${colIdx}`

          // Угол сетки
          if (isHRow && isVCol) {
            return <div key={key} style={{ width: EDGE, height: EDGE }} />
          }

          // Горизонтальное ребро
          if (isHRow) {
            const isOuter = row === 0 || row === rows
            if (isOuter || col >= cols) {
              return <div key={key} style={{ width: "100%", height: EDGE }} />
            }
            const value = hEdges[row]?.[col] ?? "none"
            return <MapEdge key={key} value={value} dir="h" />
          }

          // Вертикальное ребро
          if (isVCol) {
            const isOuter = col === 0 || col === cols
            if (isOuter || row >= rows) {
              return <div key={key} style={{ width: EDGE, height: CELL }} />
            }
            const value = vEdges[row]?.[col] ?? "none"
            return <MapEdge key={key} value={value} dir="v" />
          }

          // ✅ Клетка: прямой доступ к 2D-массиву — никаких формул!
          const cell = cells[row]?.[col]
          if (!cell) return <div key={key} />

          return (
            <MapCell
              key={key}
              cell={cell}
              onClick={
                interactive && onCellClick
                  ? () => onCellClick(row, col)
                  : undefined
              }
            />
          )
        })
      })}
    </div>
  )
}

// import { Cell, EdgeType } from "@/types/zombicide"
// import style from "./MapView.module.scss"
// import { floorColor, floorImage } from "@/utils/floorImage"

// const CELL = 80
// const EDGE = 14

// interface MapViewProps {
//   cols: number
//   rows: number
//   cells: Cell[][]
//   hEdges: EdgeType[][]
//   vEdges: EdgeType[][]
// }

// export function MapView({ cols, rows, cells, hEdges, vEdges }: MapViewProps) {
//   console.log("cells", cells)
//   console.log("hEdges", hEdges)
//   console.log("vEdges", vEdges)
//   return (
//     <div
//       style={{
//         display: "grid",
//         gridTemplateColumns: `${EDGE}px repeat(${cols}, ${CELL}px ${EDGE}px)`,
//         // border: "3px solid #444",
//         // borderRadius: 4,
//       }}
//       className={style.mapView}
//     >
//       {Array.from({ length: rows * 2 + 1 }, (_, rowIdx) => {
//         const isHRow = rowIdx % 2 === 0
//         const row = Math.floor(rowIdx / 2)

//         return Array.from({ length: cols * 2 + 1 }, (_, colIdx) => {
//           const isVCol = colIdx % 2 === 0
//           const col = Math.floor(colIdx / 2)
//           const key = `${rowIdx}-${colIdx}`

//           if (isHRow && isVCol) {
//             return <div key={key} style={{ width: EDGE, height: EDGE }} />
//           }

//           if (isHRow) {
//             const value: EdgeType = hEdges[row]?.[col] ?? "none"
//             return (
//               <div
//                 key={key}
//                 style={{
//                   width: "100%",
//                   height: EDGE,
//                   background:
//                     value === "wall"
//                       ? "#444"
//                       : value === "door"
//                         ? "#c8a227"
//                         : "transparent",
//                   borderRadius: 2,
//                 }}
//               />
//             )
//           }

//           if (isVCol) {
//             const value: EdgeType = vEdges[row]?.[col] ?? "none"
//             return (
//               <div
//                 key={key}
//                 style={{
//                   width: EDGE,
//                   height: "100%",
//                   background:
//                     value === "wall"
//                       ? "#444"
//                       : value === "door"
//                         ? "#c8a227"
//                         : "transparent",
//                   borderRadius: 2,
//                 }}
//               />
//             )
//           }

//           const cellIdx = row * cols + col
//           const cell = cells[cellIdx]
//           if (!cell) return <div key={key} />

//           return (
//             <div
//               key={key}
//               className={style.mapView__item}
//               style={{
//                 width: CELL,
//                 height: CELL,
//                 backgroundColor: floorColor[cell.type],
//                 backgroundImage: floorImage[cell.type],
//                 backgroundSize: "cover",
//                 backgroundPosition: "center",
//               }}
//             />
//           )
//         })
//       })}
//     </div>
//   )
// }
