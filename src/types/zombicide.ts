// types/zombicide.ts

// ===== Базовые типы =====
export type Phase = "waiting" | "player_turn" | "zombie_turn" | "game_over"
export type ThreatLevel = "yellow" | "orange" | "red"
export type ZombieType = "walker" | "runner" | "fatty"
export type EdgeDirection = "top" | "right" | "bottom" | "left"

// ===== Координаты и сетка =====
/** Координаты клетки в 2D-сетке */
export interface GridCoords {
  row: number
  col: number
}

/** Типы клеток карты */
export type CellType =
  | "empty"
  | "street"
  | "room"
  | "spawn"
  | "exit"
  | "entrance"

/** Типы рёбер (стен/дверей) между клетками */
export type EdgeType = "none" | "wall" | "door"

/** Клетка карты — минимальная единица */
export interface Cell {
  type: CellType
  // Можно добавить позже: loot, traps, visibility и т.д.
}

// ===== Сохранённая карта (из БД) =====
export interface GameMap {
  _id: string
  name: string
  createdBy: {
    username: string
    avatar: string
    _id: string
  }
  cols: number
  rows: number
  cells: Cell[][] // flat для БД
  hEdges: EdgeType[][]
  vEdges: EdgeType[][]
  createdAt: string
  updatedAt?: string // полезно для кэширования
}

// ===== Игровые сущности =====
export interface Weapon {
  id: string
  name: string
  damage: number
  noise: number // уровень шума при выстреле
  range: "melee" | "ranged"
  ammo?: number // опционально: патроны
}

export interface Player {
  id: string // userId из auth
  name: string
  avatar: string
  hp: number
  maxHp: number
  position: GridCoords // ✅ вместо zoneId: number — явные координаты!
  actions: number
  maxActions: number
  threatLevel: ThreatLevel
  weapons: Weapon[]
  backpack: Weapon[] // макс 3 слота — можно добавить валидацию позже
  isAlive: boolean // удобнее, чем проверять hp <= 0 везде
  isReady?: boolean
}

export interface Zombie {
  id: string
  type: ZombieType
  position: GridCoords // ✅ тоже координаты, а не zoneId
  hp: number
  maxHp: number // полезно для прогресс-бара урона
  speed?: number // на будущее: разные типы зомби
}

// ===== Состояние игры =====
export interface GameState {
  phase: Phase
  round: number
  currentPlayerId: string | null
  players: Player[]
  zombies: Zombie[]
  map: GameMap // ✅ явно указываем, что в игре используется flat
  noiseMap: Record<string, number> // key: `${row}-${col}` → уровень шума
  winner: "players" | "zombies" | null
  settings?: {
    // опционально: настройки партии
    difficulty: "easy" | "normal" | "hard"
    zombieSpawnRate: number
  }
}

// ===== Лобби =====
export interface Room {
  id: string
  name: string
  hostId: string
  hostName: string
  mapId: string
  mapName: string
  players: Array<Pick<Player, "id" | "name" | "avatar" | "isReady">> // ✅ добавил isReady
  maxPlayers: number
  status: "waiting" | "in_progress" | "finished"
  createdAt: string
  settings?: {
    private: boolean
    password?: string
  }
}

// ===== Redux state =====
export interface ZombicideState {
  // Списки
  rooms: Room[]
  maps: GameMap[]

  // Текущие сущности
  currentRoom: Room | null
  currentMap: GameMap | null // для редактора
  activeGame: GameState | null // для игры

  // Пагинация для списков
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }

  // UI и загрузка
  status: "idle" | "loading" | "error" | "success"
  error: string | null
  // lastActionAt?: number // timestamp для оптимистичных обновлений
}

// // types/zombicide.ts

// export type Phase = "waiting" | "player_turn" | "zombie_turn" | "game_over"

// export type ThreatLevel = "yellow" | "orange" | "red"

// export type ZombieType = "walker" | "runner" | "fatty"

// // --- карта ---

// export type CellType =
//   | "empty"
//   | "street"
//   | "room"
//   | "spawn"
//   | "exit"
//   | "entrance"

// export type EdgeType = "none" | "wall" | "door"
// export interface Cell {
//   type: CellType

// }

// export interface GameMap {
//   _id: string
//   name: string
//   createdBy: { username: string; avatar: string; _id: string } // userId
//   cols: number
//   rows: number
//   cells: Cell[]
//   hEdges: EdgeType[][] // (rows+1) × cols
//   vEdges: EdgeType[][] // rows × (cols+1)
//   createdAt: string
// }

// // --- игроки ---

// export interface Weapon {
//   id: string
//   name: string
//   damage: number
//   noise: number // сколько шума генерирует выстрел
//   range: "melee" | "ranged"
// }

// export interface Player {
//   id: string // userId из соцсети
//   name: string
//   avatar: string
//   hp: number
//   maxHp: number
//   zoneId: number // где находится на карте
//   actions: number // сколько действий осталось в этот ход
//   maxActions: number
//   threatLevel: ThreatLevel
//   weapons: Weapon[]
//   backpack: Weapon[] // макс 3 предмета
// }

// // --- зомби ---

// export interface Zombie {
//   id: string
//   type: ZombieType
//   zoneId: number
//   hp: number
// }

// // --- игра ---

// export interface GameState {
//   phase: Phase
//   round: number
//   currentPlayerId: string | null
//   players: Player[]
//   zombies: Zombie[]
//   map: Cell[]
//   noiseMap: Record<number, number> // zoneId → уровень шума
//   winner: "players" | "zombies" | null
// }

// // --- лобби ---

// export interface Room {
//   id: string
//   name: string
//   hostId: string
//   hostName: string
//   mapId: string
//   mapName: string
//   players: Pick<Player, "id" | "name" | "avatar">[]
//   maxPlayers: number
//   status: "waiting" | "in_progress"
//   createdAt: string
// }

// // --- слайс ---

// export interface ZombicideState {
//   rooms: Room[]
//   currentRoom: Room | null
//   gameState: GameState | null
//   maps: GameMap[]
//   currentMap: GameMap | null
//   page: number
//   limit: number
//   total: number
//   pages: number
//   status: "idle" | "loading" | "error"
//   error: string | null
// }
