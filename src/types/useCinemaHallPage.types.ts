import {
  RefObject,
  ChangeEvent,
  DragEvent,
  Dispatch,
  SetStateAction,
} from "react"
import { Socket } from "socket.io-client"
import { TorrentStatus, TorrentInstance } from "@/types/webtorrent.types"
import { ParticipantsType } from "@/types/cinemaHall.types"

// ─────────────────────────────────────────────
// 🎯 Основной интерфейс возврата хука
// ─────────────────────────────────────────────
export interface UseCinemaHallPageReturn {
  // 🎬 UI State (состояния интерфейса)
  cinemaHallName: string | null
  movieName: string
  setMovieName: Dispatch<SetStateAction<string>>
  isDragging: boolean
  isHashing: boolean
  isFilePrepared: boolean
  isSeedingActive: boolean
  canCreateHall: boolean
  torrentStatus: TorrentStatus
  failedTracker: string | undefined
  // bufferingStatus: boolean
  bufferProgress: number
  playing: boolean
  currentTime: number

  // 📁 File & Drag-n-Drop
  file: File | null
  inputRef: RefObject<HTMLInputElement | null>
  handleDragOver: (e: DragEvent<HTMLDivElement>) => void
  handleDragLeave: () => void
  handleDrop: (e: DragEvent<HTMLDivElement>) => void
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void

  // 🎥 Video Player Refs & Sources
  videoRef: RefObject<HTMLVideoElement | null>
  blobUrlRef: RefObject<string | null>
  magnet: string | null

  // 🎮 Video Controls (нативные события видео)
  handleNativePlay: () => void
  handleNativePause: () => void
  //   handleNativeSeeked: () => void
  //   handleNativeWaiting: () => void
  //   handleNativeCanPlay: () => void

  // 🎮 Video Controls (запросы от пользователя)
  handlePlayRequest: () => void
  handlePauseRequest: () => void
  handleSeekRequest: (time: number) => void

  handleSeeked: (e: React.SyntheticEvent<HTMLVideoElement>) => void
  handleWaiting: (e: React.SyntheticEvent<HTMLVideoElement>) => void
  handleCanPlay: () => void

  // 👥 Room & Socket Data
  groupId: string
  socket: Socket | null
  hostId: string | null
  userId: string | null
  roomUsers: ParticipantsType[]
  waitingForUsers: string[] // или ParticipantsType[] — уточни по своему стору

  // ⚙️ Torrent & Actions
  torrentRef: RefObject<TorrentInstance | null>
  createHandle: () => void
}
