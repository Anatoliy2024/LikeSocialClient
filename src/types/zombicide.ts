// types/zombicide.ts

// export type ZoneType = "floor" | "room" | "spawn" | "exit" | "wall" | "empty"

export type Phase = "waiting" | "player_turn" | "zombie_turn" | "game_over"

export type ThreatLevel = "yellow" | "orange" | "red"

export type ZombieType = "walker" | "runner" | "fatty"

// --- карта ---

// export interface Zone {
//   id: number
//   type: ZoneType
//   neighbors: number[] // id соседних зон
// }

export type CellType =
  | "empty"
  | "street"
  | "room"
  | "spawn"
  | "exit"
  | "entrance"

export type EdgeType = "none" | "wall" | "door"
export interface Cell {
  type: CellType
  // borders: {
  //   top: "none" | "wall" | "door"
  //   right: "none" | "wall" | "door"
  //   bottom: "none" | "wall" | "door"
  //   left: "none" | "wall" | "door"
  // }
}

export interface GameMap {
  _id: string
  name: string
  createdBy: { username: string; avatar: string; _id: string } // userId
  cols: number
  rows: number
  cells: Cell[]
  hEdges: EdgeType[][] // (rows+1) × cols
  vEdges: EdgeType[][] // rows × (cols+1)
  createdAt: string
}

// --- игроки ---

export interface Weapon {
  id: string
  name: string
  damage: number
  noise: number // сколько шума генерирует выстрел
  range: "melee" | "ranged"
}

export interface Player {
  id: string // userId из соцсети
  name: string
  avatar: string
  hp: number
  maxHp: number
  zoneId: number // где находится на карте
  actions: number // сколько действий осталось в этот ход
  maxActions: number
  threatLevel: ThreatLevel
  weapons: Weapon[]
  backpack: Weapon[] // макс 3 предмета
}

// --- зомби ---

export interface Zombie {
  id: string
  type: ZombieType
  zoneId: number
  hp: number
}

// --- игра ---

export interface GameState {
  phase: Phase
  round: number
  currentPlayerId: string | null
  players: Player[]
  zombies: Zombie[]
  map: Cell[]
  noiseMap: Record<number, number> // zoneId → уровень шума
  winner: "players" | "zombies" | null
}

// --- лобби ---

export interface Room {
  id: string
  name: string
  hostId: string
  hostName: string
  mapId: string
  mapName: string
  players: Pick<Player, "id" | "name" | "avatar">[]
  maxPlayers: number
  status: "waiting" | "in_progress"
  createdAt: string
}

// --- слайс ---

export interface ZombicideState {
  rooms: Room[]
  currentRoom: Room | null
  gameState: GameState | null
  maps: GameMap[]
  currentMap: GameMap | null
  page: number
  limit: number
  total: number
  pages: number
  status: "idle" | "loading" | "error"
  error: string | null
}

// Несколько решений которые стоит отметить:
// noiseMap — это отдельный объект { zoneId: число } а не поле внутри каждой зоны, потому что шум сбрасывается каждый раунд и часто меняется — удобнее обновлять одним объектом.
// backpack и weapons разделены — weapons это то что в руках (максимум 2), backpack это запас. Как в оригинале.
// Pick<Player, 'id' | 'name' | 'avatar'> в комнате — чтобы не тащить весь объект игрока в лобби где он не нужен.
// Хочешь сразу пропишем zombicideSlice.ts с initialState и редьюсерами?
