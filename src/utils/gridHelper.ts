// // utils/gridHelpers.ts
// import { Cell, EdgeType, GridCoords } from "@/types/zombicide"

// export const flatToGrid = <T>(items: T[], rows: number, cols: number): T[][] =>
//   Array(rows)
//     .fill(null)
//     .map((_, r) => items.slice(r * cols, (r + 1) * cols))

// export const gridToFlat = <T>(grid: T[][]): T[] => grid.flat()

// export const coordsToIndex = (row: number, col: number, cols: number): number =>
//   row * cols + col

// export const indexToCoords = (idx: number, cols: number): GridCoords => ({
//   row: Math.floor(idx / cols),
//   col: idx % cols,
// })
