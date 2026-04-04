// utils/floorImage.ts
type FloorType = "empty" | "street" | "room" | "entrance" | "exit" | "spawn"

export const floorImage: Record<FloorType, string> = {
  empty: "none",
  street: "url('/games/zombicide/tiles/street.jpg')",
  room: "url('/games/zombicide/tiles/room.jpg')",
  entrance: "url('/games/zombicide/tiles/entrance.png')",
  exit: "url('/games/zombicide/tiles/exit.png')",
  spawn: "url('/games/zombicide/tiles/spawn.jpg')",
}

export const floorColor: Record<FloorType, string> = {
  empty: "transparent",
  street: "#C8B89A",
  room: "#8B9E7A",
  entrance: "#7A9EBA",
  exit: "#9EBA7A",
  spawn: "#BA7A7A",
}
