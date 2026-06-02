import { useSocket } from "@/providers/SocketProvider"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setCinemaHall } from "@/store/slices/cinemaHallSlice"
import { CinemaHallTargetType } from "@/types/cinemaHall.types"
import {
  TorrentInstance,
  TorrentStatus,
  WebTorrentInstance,
} from "@/types/webtorrent.types"
import { useSearchParams } from "next/navigation"
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import { useCinemaHallSync } from "./useCinemaHallSync"
import { calculateSeedingDelay } from "@/utils/calculateSeedingDelay"
import { TRACKERS } from "@/constants/webTorrentConfig"
import { useInitCinemaHall } from "./useInitCinemaHall"
import { useSocketCinemaHall } from "./useSocketCinemaHall"
import { waitForClient } from "@/utils/waitForClient"
import { UseCinemaHallPageReturn } from "@/types/useCinemaHallPage.types"
import { useClockSync } from "./useClockSync"

export const useCinemaHallPage = (id: string): UseCinemaHallPageReturn => {
  const searchParams = useSearchParams()
  const groupId = searchParams.get("group") as string

  const dispatch = useAppDispatch()
  const socket = useSocket()

  const [file, setFile] = useState<File | null>(null)
  const [movieName, setMovieName] = useState("")
  const [magnetURI, setMagnetURI] = useState<string | null>(null)
  const [isHashing, setIsHashing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [torrentStatus, setTorrentStatus] = useState<TorrentStatus>("idle")
  const [failedTracker, setFailedTracker] = useState<string | undefined>(
    undefined,
  )
  // const [bufferingStatus, setBufferingStatus] = useState<boolean>(false)
  const [bufferProgress, setBufferProgress] = useState(0)
  const [isFilePrepared, setIsFilePrepared] = useState(false) // файл готов локально

  const [isSeedingActive, setIsSeedingActive] = useState(false) // ← НОВОЕ: файл готов И раздача стабильна

  const inputRef = useRef<HTMLInputElement | null>(null)
  const clientRef = useRef<WebTorrentInstance | null>(null)
  const torrentRef = useRef<TorrentInstance | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const torrentInfoHashRef = useRef<string | null>(null)
  const lastLoggedProgress = useRef(0)
  const blobUrlRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const peerCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cinemaHallName = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.cinemaHallName,
  )
  const hostId = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.hostId,
  )
  const userId = useAppSelector((state) => state.auth.userId)

  const playing = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.playing,
  )
  const currentTime = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.currentTime,
  )
  const magnet = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.file.magnet,
  )
  const roomUsers = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.participants,
  )
  const waitingForUsers = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.waitingForUsers,
  )
  const username = useAppSelector((state) => state.auth.username)
  const avatar = useAppSelector((state) => state.auth.avatar)

  useClockSync(socket)

  const {
    handleSeeked,
    handleNativePlay,
    handleNativePause,
    handlePlayRequest,
    handlePauseRequest,
    handleSeekRequest,
    handleWaiting,
    handleCanPlay,
    activate,
  } = useCinemaHallSync({ cinemaHallId: id, groupId, videoRef, torrentRef })

  useInitCinemaHall(
    clientRef,
    torrentRef,
    peerCheckRef,
    abortControllerRef,
    torrentInfoHashRef,
    blobUrlRef,
  )

  useSocketCinemaHall(
    socket,
    id,
    dispatch,
    groupId,
    activate,
    setTorrentStatus,
    setFailedTracker,
    clientRef,
    torrentRef,
    torrentInfoHashRef,
    peerCheckRef,
    lastLoggedProgress,
    setBufferProgress,
    // setBufferingStatus,
    videoRef,
    avatar,
    username,
  )

  const handleFile = async (f: File) => {
    if (!f.type.startsWith("video/")) return

    const fileSize = f.size
    setFile(f)
    setIsHashing(true)
    setIsFilePrepared(false)
    setMagnetURI(null)
    setTorrentStatus("idle")

    const ac = new AbortController()
    abortControllerRef.current = ac // ← сохраняем

    try {
      const client = await waitForClient(clientRef, ac.signal)

      // const client = await waitForClient(clientRef)
      if (torrentRef.current) {
        torrentRef.current.destroy()
      }

      const torrent = client.seed(f, {
        announce: TRACKERS,
      })

      torrentRef.current = torrent

      torrent.on("ready", () => {
        // console.log("🧲 Magnet:", torrent.magnetURI)

        setMagnetURI(torrent.magnetURI)
        // setIsHashing(false)
        torrentInfoHashRef.current = torrent.infoHash
        // setupTorrentPlayer(torrent)

        // Но не считаем "готовым для зала", пока не пойдёт отдача
      })

      // ✅ ВСЕ куски верифицированы — финальная готовность
      torrent.on("done", () => {
        console.log("🎉 done: торрент полностью готов!")
        setIsFilePrepared(true)
        setIsHashing(false)

        // 🔥 Динамический буфер на основе размера файла
        const delay = calculateSeedingDelay(fileSize)
        console.log("file", fileSize)
        console.log(
          `⏳ Буфер готовности: ${delay / 1000} сек (файл: ${(fileSize / 1024 / 1024 / 1024).toFixed(1)} ГБ)`,
        )

        setTimeout(() => {
          setIsSeedingActive(true)
          console.log("✅ Раздача стабильна, можно создавать комнату")
        }, delay)
      })

      torrent.on("error", (err) => {
        console.error("Ошибка хэширования:", err)
        setIsHashing(false)
      })
    } catch (err) {
      console.error("Клиент не готов:", err)
      setIsHashing(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleFile(selected)
  }

  const createHandle = () => {
    if (!socket || !file || !magnetURI || !clientRef.current || !movieName)
      return

    socket.emit(
      "cinema-hall:create",
      {
        cinemaHallId: id,
        cinemaHallName: movieName,
        username,
        avatar,
        groupId,
        file: { name: file.name, size: file.size, magnet: magnetURI },
        peerId: clientRef.current.peerId,
      },
      async (data: { hall: CinemaHallTargetType }) => {
        // console.log("Зал создан:", data.hall)
        if (torrentRef.current) {
          await dispatch(setCinemaHall(data.hall))
          activate()
          // Создатель смотрит локальный файл напрямую — без торрента
          if (videoRef.current && file) {
            // 1. Сначала отзываем старый, если есть
            if (blobUrlRef.current) {
              URL.revokeObjectURL(blobUrlRef.current)
            }

            // 2. Создаем новый
            const blobUrl = URL.createObjectURL(file)
            blobUrlRef.current = blobUrl
            videoRef.current.src = blobUrl
            // videoRef.current.play().catch(() => {})
            setTorrentStatus("done")
          }

          // setupTorrentPlayer(torrentRef.current)
        }
        // initClient()
      },
    )
  }

  const canCreateHall = useMemo(() => {
    return (
      !!file &&
      !!movieName.trim() &&
      !!magnetURI &&
      isFilePrepared &&
      isSeedingActive && // ← НОВОЕ: ждём не только done, но и буфер
      !isHashing
    )
  }, [file, movieName, magnetURI, isFilePrepared, isSeedingActive, isHashing])

  useEffect(() => {
    if (torrentStatus !== "peer_search") return
    const id = setTimeout(() => setTorrentStatus("peer_timeout"), 30_000)
    return () => clearTimeout(id)
  }, [torrentStatus])

  return {
    // 🎬 UI State (состояния интерфейса)
    cinemaHallName,
    movieName,
    setMovieName,
    isDragging,
    isHashing,
    isFilePrepared,
    isSeedingActive,
    canCreateHall,
    torrentStatus,
    failedTracker,
    // bufferingStatus,
    bufferProgress,
    playing,
    currentTime,

    // 📁 File & Drag-n-Drop
    file,
    inputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,

    // 🎥 Video Player Refs & Sources
    videoRef,
    blobUrlRef,
    magnet,

    // 🎮 Video Controls (нативные события видео)
    handleNativePlay,
    handleNativePause,

    // 🎮 Video Controls (запросы от пользователя)
    handlePlayRequest,
    handlePauseRequest,
    handleSeekRequest,

    handleSeeked,
    handleWaiting,
    handleCanPlay,

    // 👥 Room & Socket Data
    groupId,
    socket,
    hostId,
    userId,
    roomUsers,
    waitingForUsers,

    // ⚙️ Torrent & Actions
    torrentRef,
    createHandle,
  }
}
