// utils/edges.ts
import { EdgeType } from "@/types/zombicide"

export function createEmptyHEdges(rows: number, cols: number): EdgeType[][] {
  return Array(rows + 1)
    .fill(null)
    .map(() => Array(cols).fill("none"))
}

export function createEmptyVEdges(rows: number, cols: number): EdgeType[][] {
  return Array(rows)
    .fill(null)
    .map(() => Array(cols + 1).fill("none"))
}

export function getEdge(
  hEdges: EdgeType[][],
  vEdges: EdgeType[][],
  row: number,
  col: number,
  dir: "top" | "bottom" | "left" | "right",
): EdgeType {
  switch (dir) {
    case "top":
      return hEdges[row][col]
    case "bottom":
      return hEdges[row + 1][col]
    case "left":
      return vEdges[row][col]
    case "right":
      return vEdges[row][col + 1]
  }
}

export function setEdge(
  hEdges: EdgeType[][],
  vEdges: EdgeType[][],
  row: number,
  col: number,
  dir: "top" | "bottom" | "left" | "right",
  value: EdgeType,
): { hEdges: EdgeType[][]; vEdges: EdgeType[][] } {
  const newH = hEdges.map((r) => [...r])
  const newV = vEdges.map((r) => [...r])

  switch (dir) {
    case "top":
      newH[row][col] = value
      break
    case "bottom":
      newH[row + 1][col] = value
      break
    case "left":
      newV[row][col] = value
      break
    case "right":
      newV[row][col + 1] = value
      break
  }

  return { hEdges: newH, vEdges: newV }
}
