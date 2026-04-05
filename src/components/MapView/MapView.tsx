import { Cell, EdgeType } from "@/types/zombicide"
import style from "./MapView.module.scss"
import { floorColor, floorImage } from "@/utils/floorImage"

const CELL = 80
const EDGE = 14

interface MapViewProps {
  cols: number
  rows: number
  cells: Cell[]
  hEdges: EdgeType[][]
  vEdges: EdgeType[][]
}

export function MapView({ cols, rows, cells, hEdges, vEdges }: MapViewProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `${EDGE}px repeat(${cols}, ${CELL}px ${EDGE}px)`,
        // border: "3px solid #444",
        // borderRadius: 4,
      }}
      className={style.mapView}
    >
      {Array.from({ length: rows * 2 + 1 }, (_, rowIdx) => {
        const isHRow = rowIdx % 2 === 0
        const row = Math.floor(rowIdx / 2)

        return Array.from({ length: cols * 2 + 1 }, (_, colIdx) => {
          const isVCol = colIdx % 2 === 0
          const col = Math.floor(colIdx / 2)
          const key = `${rowIdx}-${colIdx}`

          if (isHRow && isVCol) {
            return <div key={key} style={{ width: EDGE, height: EDGE }} />
          }

          if (isHRow) {
            const value: EdgeType = hEdges[row]?.[col] ?? "none"
            return (
              <div
                key={key}
                style={{
                  width: "100%",
                  height: EDGE,
                  background:
                    value === "wall"
                      ? "#444"
                      : value === "door"
                        ? "#c8a227"
                        : "transparent",
                  borderRadius: 2,
                }}
              />
            )
          }

          if (isVCol) {
            const value: EdgeType = vEdges[row]?.[col] ?? "none"
            return (
              <div
                key={key}
                style={{
                  width: EDGE,
                  height: "100%",
                  background:
                    value === "wall"
                      ? "#444"
                      : value === "door"
                        ? "#c8a227"
                        : "transparent",
                  borderRadius: 2,
                }}
              />
            )
          }

          const cellIdx = row * cols + col
          const cell = cells[cellIdx]
          if (!cell) return <div key={key} />

          return (
            <div
              key={key}
              className={style.mapView__item}
              style={{
                width: CELL,
                height: CELL,
                backgroundColor: floorColor[cell.type],
                backgroundImage: floorImage[cell.type],
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )
        })
      })}
    </div>
  )
}
