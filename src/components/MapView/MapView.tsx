import { Cell } from "@/types/zombicide"
import { getBorderClass } from "@/utils/borderClass"
import style from "./MapView.module.scss"
import { floorColor, floorImage } from "@/utils/floorImage"
interface MapViewProps {
  cols: number
  rows: number
  cells: Cell[]
}

export function MapView({ cols, rows, cells }: MapViewProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 80px)`,
        gap: 3,
      }}
      className={style.mapView}
    >
      {cells.map((cell, idx) => (
        <div
          key={idx}
          className={`
            ${style.mapView__item}
            ${getBorderClass("top", cell.borders.top, style)}
            ${getBorderClass("right", cell.borders.right, style)}
            ${getBorderClass("bottom", cell.borders.bottom, style)}
            ${getBorderClass("left", cell.borders.left, style)}
          `}
          style={{
            backgroundColor:
              cell.type === "empty" ? "transparent" : floorColor[cell.type],
            backgroundImage: floorImage[cell.type],
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}
    </div>
  )
}
