"use client"

import { useSocket } from "@/providers/SocketProvider"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
// import { getCinemaBlobUrl } from "@/store/cinemaFile"
import style from "./WatchPage.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setCinemaHall } from "@/store/slices/cinemaHallSlice"
// import { useTorrent } from "@/providers/TorrentProvider"

// type WebTorrentInstance = any
type TorrentInstance = any

export default function WatchPage() {
  // const {
  //   client,
  //   isReady: isClientReady,
  //   handleCreateMovieHall,
  //   handleLeaveMovieHall,
  // } = useTorrent()

  const { id } = useParams() as { id: string }
  const dispatch = useAppDispatch()
  const socket = useSocket()

  const cinemaHallName = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.cinemaHallName,
  )
  const groupId = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.groupId,
  )
  // const userId = useAppSelector((state) => state.auth.userId)
  // const hallFile = useAppSelector(
  //   (state) => state.cinemaHall.cinemaHallTarget.file,
  // )

  const [torrentStatus, setTorrentStatus] = useState<
    "idle" | "connecting" | "buffering" | "ready" | "error"
  >("idle")
  const [bufferProgress, setBufferProgress] = useState(0)
  // const [blobUrl, setBlobUrl] = useState<string | null>(null)

  // const clientRef = useRef<WebTorrentInstance>(null)
  const torrentRef = useRef<TorrentInstance>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  // const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // const blobUrlRef = useRef<string | null>(null)

  const tryRenderVideo = () => {
    const torrent = torrentRef.current
    if (!torrent || !torrent.ready) return
    console.log(
      "🎬 tryRenderVideo вызвана, torrent.ready =",
      torrentRef.current?.ready,
    )
    // 1. Проверяем, что торрент готов и есть файлы

    const videoFile = torrentRef.current.files?.find((f: any) =>
      f.name?.match(/\.(mp4|mkv|webm)$/i),
    )

    // 2. Проверяем, что файл имеет метод renderTo
    if (
      videoFile &&
      typeof videoFile.renderTo === "function" &&
      videoRef.current
    ) {
      console.log("🎬 Рендерим видео в DOM")
      videoFile.renderTo(videoRef.current, { autoplay: false })
      setTorrentStatus("ready")
      return true // Успех
    }
    // Если не прошло — логируем для отладки
    console.warn("⚠️ Не удалось рендерить:", {
      hasFile: !!videoFile,
      hasRenderTo: typeof videoFile?.renderTo,
      filesCount: torrent.files?.length,
      ready: torrent.ready,
    })
    return false // Не удалось
  }

  const connectMagnet = async (magnet: string) => {
    console.log("before !clientRef.current || !magnet", !client, !magnet)
    if (!client || !magnet) return
    console.log("magnet", magnet)

    if (!isClientReady) {
      console.log("торрент неготов", isClientReady)
    }
    const existing = await client.get(magnet)
    console.log("existing", existing)

    let torrent

    if (existing) {
      // Если есть — просто берем его, НЕ создаем новый!
      torrent = existing
      console.log("был найден", torrent)
    } else {
      try {
        torrent = client.add(magnet)
        console.log("✅ Торрент создан, infoHash:", torrent.infoHash)
        console.log("✅ Торрент создан, torrent:", torrent)
      } catch (err) {
        console.error("❌ Ошибка при добавлении торрента:", err)
        setTorrentStatus("error")
        return
      }
    }

    console.log("🔍 DEBUG torrent:", {
      ready: torrent.ready, // ← Главное: true или false?
      files: torrent.files?.length, // ← Сколько файлов видит?
      firstFileName: torrent.files?.[0]?.name, // ← Имя первого файла
      hasRenderTo: typeof torrent.files?.[0]?.renderTo, // ← Есть ли метод?
    })

    torrentRef.current = torrent

    torrent.on("ready", tryRenderVideo)
    torrent.on("metadata", tryRenderVideo)
    torrent.on("download", () => {
      const progress = Math.round(torrent.progress * 100)
      setBufferProgress(progress)
      if (progress > 5) setTorrentStatus("ready")
    })

    torrent.on("error", (err: Error) => {
      console.error("Torrent error:", err)
      setTorrentStatus("error")
    })

    torrent.on("metadata", () => {
      console.log("✅ Метаданные получены")
      setTorrentStatus("buffering")
    })

    torrent.on("warning", (err) => {
      console.warn("⚠️ Предупреждение WebTorrent:", err)
    })

    if (torrent.ready) {
      console.log("torrent.ready проверка")
      tryRenderVideo()

      // const videoFile = torrent.files?.find((f: any) =>
      //   f.name.match(/\.(mp4|mkv|webm)$/),
      // )
      // if (videoFile && videoRef.current) {
      //   videoFile.renderTo(videoRef.current, { autoplay: false })
      //   setTorrentStatus("ready")
      // }
    }
  }
  useEffect(() => {
    if (!isClientReady) {
      handleCreateMovieHall()
    }
  }, [])

  useEffect(() => {
    if (!socket || !id) return
    // console.log("На странице до join:", getCinemaBlobUrl()) // null?
    // запрашиваем данные комнаты
    socket.emit("cinema-hall:join", { cinemaHallId: id }, (data) => {
      if (data.error) {
        // нет доступа или комната не найдена
        console.error(data.error)
        return
      }
      dispatch(setCinemaHall(data.hall))

      if (data.hall?.file?.magnet) {
        connectMagnet(data.hall.file.magnet)
      }
    })

    return () => {
      // выходим из комнаты когда уходим со страницы
      socket.emit("cinema-hall:leave", { cinemaHallId: id, groupId })
    }
  }, [socket, id])

  if (!cinemaHallName) return <div>Загрузка...</div>

  return (
    <div className={style.watchPage}>
      <h1>{cinemaHallName}</h1>

      {/* Video всегда в DOM чтобы renderTo мог найти элемент */}
      <video
        ref={videoRef}
        // src={blobUrl ?? undefined}
        controls
        style={{
          width: "100%",
          display: torrentStatus === "ready" ? "block" : "none",
        }}
      />
      <div>Статус: {torrentStatus}</div>

      {/* <div>magnet url: {blobUrl}</div> */}
      {torrentStatus === "connecting" && <p>🔍 Поиск пиров...</p>}
      {torrentStatus === "buffering" && (
        <p>⏳ Буферизация: {bufferProgress}%</p>
      )}
      {torrentStatus === "error" && <p>❌ Ошибка подключения.</p>}
    </div>
  )
}
