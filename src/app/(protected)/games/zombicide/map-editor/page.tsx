"use client"
import Link from "next/link"
import style from "./map-editor.module.scss"
import { useState } from "react"
import { getBorderClass } from "@/utils/borderClass"
import { floorColor, floorImage } from "@/utils/floorImage"
import { useAppDispatch } from "@/store/hooks"
import { saveMapThunk } from "@/store/thunks/zombicideThunks"
import { Cell, CellType } from "@/types/zombicide"

type ToolsType = "floor" | "separator" | "clear" | null
type separatorType = "wall" | "door" | "none"

const instant: Cell = {
  type: "empty",
  borders: {
    top: "none",
    right: "none",
    bottom: "none",
    left: "none",
  },
}

export default function MapEditor() {
  const dispatch = useAppDispatch()
  const [mapName, setMapName] = useState("")
  const [cols, setCols] = useState(6) // значение в input
  const [rows, setRows] = useState(5) // значение в input
  const [appliedCols, setAppliedCols] = useState(0) // применённые после кнопки
  const [appliedRows, setAppliedRows] = useState(0) // применённые после кнопки
  const [grid, setGrid] = useState<Cell[]>([])
  const [targetItem, setTargetItem] = useState<number | null>(null)
  const [tool, setIsTool] = useState<ToolsType>(null)
  const [floor, setFloor] = useState<CellType>("empty")
  const [separator, setSeparator] = useState<separatorType>("none")

  const handleCreate = () => {
    const checkCol = Math.min(Math.max(cols, 6), 15)
    const checkRow = Math.min(Math.max(rows, 5), 15)
    setCols(checkCol)
    setRows(checkRow)
    setAppliedCols(checkCol) // ← фиксируем размер
    setAppliedRows(checkRow)
    const cells: Cell[] = Array(checkCol * checkRow)
      .fill(null)
      .map(() => ({ ...instant }))
    setGrid(cells)
  }
  const handleSaveMap = () => {
    if (!mapName || grid.length === 0) return
    dispatch(saveMapThunk({ name: mapName, cols, rows, cells: grid }))
  }

  const setBorder = (
    idx: number,
    side: "top" | "right" | "bottom" | "left",
    value: "none" | "wall" | "door",
  ) => {
    setGrid((prev) => {
      const next = [...prev]

      // ставим стену на текущей ячейке
      next[idx] = {
        ...next[idx],
        borders: { ...next[idx].borders, [side]: value },
      }

      // зеркалим на соседа автоматически
      const mirror: Record<string, { offset: number; side: string }> = {
        top: { offset: -cols, side: "bottom" },
        bottom: { offset: +cols, side: "top" },
        left: { offset: -1, side: "right" },
        right: { offset: +1, side: "left" },
      }

      const { offset, side: mirrorSide } = mirror[side]
      const neighborIdx = idx + offset

      const currentRow = Math.floor(idx / cols)
      const neighborRow = Math.floor(neighborIdx / cols)

      const isValidNeighbor =
        neighborIdx >= 0 &&
        neighborIdx < next.length &&
        (side === "left" || side === "right"
          ? neighborRow === currentRow
          : true)

      if (isValidNeighbor) {
        next[neighborIdx] = {
          ...next[neighborIdx],
          borders: { ...next[neighborIdx].borders, [mirrorSide]: value },
        }
      }

      return next
    })
  }

  // const getNeighbors = (idx: number, grid: Zone[], cols: number) => {
  //   const neighbors: number[] = []
  //   const row = Math.floor(idx / cols)
  //   const col = idx % cols

  //   // левый сосед — только если нет стены слева
  //   if (
  //     col > 0 &&
  //     grid[idx].borders.left === "none" &&
  //     grid[idx - 1].type !== "empty"
  //   )
  //     neighbors.push(idx - 1)

  //   // правый сосед
  //   if (
  //     col < cols - 1 &&
  //     grid[idx].borders.right === "none" &&
  //     grid[idx + 1].type !== "empty"
  //   )
  //     neighbors.push(idx + 1)

  //   // верхний сосед
  //   if (
  //     row > 0 &&
  //     grid[idx].borders.top === "none" &&
  //     grid[idx - cols].type !== "empty"
  //   )
  //     neighbors.push(idx - cols)

  //   // нижний сосед
  //   if (
  //     row < rows - 1 &&
  //     grid[idx].borders.bottom === "none" &&
  //     grid[idx + cols].type !== "empty"
  //   )
  //     neighbors.push(idx + cols)

  //   return neighbors
  // }

  const clearItem = (idx: number) => {
    setGrid((prev) => {
      const next = [...prev]

      // сбрасываем текущую ячейку
      next[idx] = { ...instant }

      const currentRow = Math.floor(idx / cols)

      const neighbors = [
        {
          offset: -cols,
          side: "bottom" as const,
          isValid: idx - cols >= 0,
        },
        {
          offset: +cols,
          side: "top" as const,
          isValid: idx + cols < next.length,
        },
        {
          offset: -1,
          side: "right" as const,
          isValid: Math.floor((idx - 1) / cols) === currentRow,
        },
        {
          offset: +1,
          side: "left" as const,
          isValid: Math.floor((idx + 1) / cols) === currentRow,
        },
      ]

      neighbors.forEach(({ offset, side, isValid }) => {
        const neighborIdx = idx + offset
        if (isValid && neighborIdx >= 0 && neighborIdx < next.length) {
          next[neighborIdx] = {
            ...next[neighborIdx],
            borders: {
              ...next[neighborIdx].borders,
              [side]: "none",
            },
          }
        }
      })

      return next
    })
  }

  return (
    <div className={style.mapEditor}>
      <Link href="/games/zombicide">Отмена</Link>
      <div>
        <div className={style.mapEditor__tools}>
          <div>
            <label htmlFor="map-name">Название карты</label>
            <input
              type="string"
              id="map-name"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="row">Рядов</label>
            <input
              type="number"
              min={5}
              max={15}
              id="row"
              value={rows}
              onChange={(e) => setRows(+e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="column">Колонок</label>
            <input
              type="number"
              min={5}
              max={15}
              id="column"
              value={cols}
              onChange={(e) => setCols(+e.target.value)}
            />
          </div>
          <button onClick={handleCreate}>Создать каркас</button>
          <button onClick={handleSaveMap}>Сохранить карту</button>
        </div>
        <div>
          <label htmlFor="floor">Пол</label>
          <select
            name="floor"
            id="floor"
            onChange={(e) => {
              setIsTool("floor")
              setFloor(e.target.value as CellType)
            }}
          >
            <option value="empty">Пусто</option>
            <option value="room">Комната</option>
            <option value="street">Улица</option>
            <option value="spawn">Спаун</option>
            <option value="entrance">Вход</option>
            <option value="exit">Выход</option>
          </select>
        </div>
        <div>
          <label htmlFor="floor">Разделитель</label>
          <select
            name="separator"
            id="separator"
            onChange={(e) => {
              setIsTool("separator")
              setSeparator(e.target.value as separatorType)
            }}
          >
            <option value="none">Не выбрано</option>
            <option value="wall">Стена</option>
            <option value="door">Дверь</option>
          </select>
        </div>
        <div className={style.mapEditor__toolActiveWrapper}>
          <span
            onClick={() => setIsTool("floor")}
            className={tool === "floor" ? style.mapEditor__toolActive : ""}
          >
            Пол
          </span>
          <span
            onClick={() => setIsTool("separator")}
            className={tool === "separator" ? style.mapEditor__toolActive : ""}
          >
            Разделитель
          </span>
          <span
            onClick={() => setIsTool("clear")}
            className={tool === "clear" ? style.mapEditor__toolActive : ""}
          >
            Отчистить
          </span>
        </div>
        <div
          className={style.mapEditor__map}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${appliedCols}, 80px)`,
            gap: 3,
          }}
        >
          {grid.map((cell, idx) => (
            <div
              key={idx}
              className={`
                      ${style.mapEditor__mapItem}
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
              onClick={() => {
                if (tool === "floor") {
                  setGrid((prev) => {
                    const next = [...prev]
                    next[idx] = { ...next[idx], type: floor }
                    return next
                  })
                } else if (tool === "separator" && separator !== "none") {
                  setTargetItem(idx)
                } else if (tool === "clear") {
                  clearItem(idx)
                  // setGrid((prev) => {
                  //   const next = [...prev]

                  //   // сбрасываем текущую ячейку
                  //   next[idx] = { ...instant }

                  //   const currentRow = Math.floor(idx / cols)

                  //   const neighbors = [
                  //     {
                  //       offset: -cols,
                  //       side: "bottom" as const,
                  //       isValid: idx - cols >= 0,
                  //     },
                  //     {
                  //       offset: +cols,
                  //       side: "top" as const,
                  //       isValid: idx + cols < next.length,
                  //     },
                  //     {
                  //       offset: -1,
                  //       side: "right" as const,
                  //       isValid: Math.floor((idx - 1) / cols) === currentRow,
                  //     },
                  //     {
                  //       offset: +1,
                  //       side: "left" as const,
                  //       isValid: Math.floor((idx + 1) / cols) === currentRow,
                  //     },
                  //   ]

                  //   neighbors.forEach(({ offset, side, isValid }) => {
                  //     const neighborIdx = idx + offset
                  //     if (
                  //       isValid &&
                  //       neighborIdx >= 0 &&
                  //       neighborIdx < next.length
                  //     ) {
                  //       next[neighborIdx] = {
                  //         ...next[neighborIdx],
                  //         borders: {
                  //           ...next[neighborIdx].borders,
                  //           [side]: "none",
                  //         },
                  //       }
                  //     }
                  //   })

                  //   return next
                  // })
                }
              }}
            >
              {cell.type !== "empty" ? cell.type : ""}
              {idx === targetItem && (
                <select
                  className={style.mapEditor__selectSeparation}
                  name="separator"
                  id="separator"
                  onChange={(e) => {
                    if (e.target.value !== "none") {
                      const side = e.target.value as
                        | "top"
                        | "right"
                        | "bottom"
                        | "left"
                      const currentValue = grid[idx].borders[side]
                      // const typeSeparator = currentValue === separator
                      setBorder(
                        idx,
                        side,
                        currentValue === separator ? "none" : separator,
                      )
                    } else {
                      clearItem(idx)
                    }
                  }}
                  // multiple
                  size={5}
                >
                  <option value="none">---</option>
                  <option value="top"> ↑</option>
                  <option value="right">→</option>
                  <option value="left">←</option>
                  <option value="bottom">↓</option>
                </select>
              )}
              {idx === targetItem && (
                <div
                  className={style.mapEditor__background}
                  onClick={(e) => {
                    e.stopPropagation()
                    setTargetItem(null)
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
