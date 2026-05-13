"use client"

import { useSocket } from "@/providers/SocketProvider"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { getCinemaBlobUrl } from "@/store/cinemaFile"
import style from "./WatchPage.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setCinemaHall } from "@/store/slices/cinemaHallSlice"

type WebTorrentInstance = any
type TorrentInstance = any

export default function WatchPage() {
  const { id } = useParams() as { id: string }
  const dispatch = useAppDispatch()
  const socket = useSocket()

  const cinemaHallName = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.cinemaHallName,
  )
  const userId = useAppSelector((state) => state.auth.userId)
  const hallFile = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.file,
  )

  const [torrentStatus, setTorrentStatus] = useState<
    "idle" | "connecting" | "buffering" | "ready" | "error"
  >("idle")
  const [bufferProgress, setBufferProgress] = useState(0)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  const clientRef = useRef<WebTorrentInstance>(null)
  const torrentRef = useRef<TorrentInstance>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const blobUrlRef = useRef<string | null>(null)

  // Инициализация WebTorrent
  useEffect(() => {
    let client: WebTorrentInstance | null = null

    const initClient = async () => {
      try {
        const WebTorrentModule =
          await import("webtorrent/dist/webtorrent.min.js")
        const WebTorrent = WebTorrentModule.default || WebTorrentModule
        client = new (WebTorrent as any)({
          dht: false,
          webSeeds: false,
          tracker: false,
        })
        clientRef.current = client
      } catch (err) {
        console.error("Failed to load WebTorrent:", err)
      }
    }

    initClient()

    return () => {
      if (client) {
        client?.destroy()
      }
      if (clientRef) {
        clientRef.current = null
      }
      if (torrentRef) {
        console.log("torrentRef.current:", torrentRef.current)
        torrentRef.current?.destroy()
        torrentRef.current = null
      }
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  const connectMagnet = useCallback((magnet: string) => {
    if (!clientRef.current || !magnet) return

    // ✅ Проверяем не добавлен ли уже этот торрент
    const existing = clientRef.current.get(magnet)
    if (existing) {
      console.log("Торрент уже добавлен, используем существующий")
      torrentRef.current = existing
      existing.files?.[0]?.renderTo(videoRef.current!, { autoplay: false })
      setTorrentStatus("ready")
      return
    }

    setTorrentStatus("connecting")

    const torrent = clientRef.current.add(magnet, { announce: [] })
    torrentRef.current = torrent

    torrent.on("metadata", () => {
      const videoFile = torrent.files?.find((f: any) =>
        f.name.match(/\.(mp4|mkv|webm)$/),
      )
      if (!videoFile) {
        setTorrentStatus("error")
        return
      }

      // Стримим прямо в video тег
      videoFile.renderTo(videoRef.current!, { autoplay: false })
      setTorrentStatus("buffering")
    })

    torrent.on("download", () => {
      const progress = Math.round(torrent.progress * 100)
      setBufferProgress(progress)
      if (progress > 5) setTorrentStatus("ready")
    })

    torrent.on("error", (err: Error) => {
      console.error("Torrent error:", err)
      setTorrentStatus("error")
    })

    // Таймаут если нет пиров
    setTimeout(() => {
      if (torrent.numPeers === 0 && torrentStatus === "connecting") {
        setTorrentStatus("error")
      }
    }, 30000)
  }, [])

  // Подключение к комнате через сокет
  useEffect(() => {
    if (!socket || !id) return

    socket.emit("cinema-hall:join", { cinemaHallId: id }, (data: any) => {
      if (data.error) {
        console.error(data.error)
        return
      }
      dispatch(setCinemaHall(data.hall))

      // Если ты создатель — у тебя уже есть файл локально
      const url = getCinemaBlobUrl()
      const isHost = data.hall.hostId === userId
      if (url && isHost) {
        blobUrlRef.current = url
        setBlobUrl(url)
        setTorrentStatus("ready")
        return
      }

      // Если зритель — подключаемся через magnet
      if (data.hall?.file?.magnet) {
        connectMagnet(data.hall.file.magnet)
      }
    })

    return () => {
      socket.emit("cinema-hall:leave", { cinemaHallId: id })
    }
  }, [socket, id])

  if (!cinemaHallName) return <div>Загрузка...</div>

  return (
    <div className={style.watchPage}>
      <h1>{cinemaHallName}</h1>

      {/* Video всегда в DOM чтобы renderTo мог найти элемент */}
      <video
        ref={videoRef}
        src={blobUrl ?? undefined}
        controls
        style={{
          width: "100%",
          display: torrentStatus === "ready" ? "block" : "none",
        }}
      />

      {torrentStatus === "connecting" && <p>🔍 Поиск пиров...</p>}
      {torrentStatus === "buffering" && (
        <p>⏳ Буферизация: {bufferProgress}%</p>
      )}
      {torrentStatus === "error" && <p>❌ Ошибка подключения.</p>}
    </div>
  )
}

// "use client"

// import { useSocket } from "@/providers/SocketProvider"
// import { useParams } from "next/navigation"
// import { useCallback, useEffect, useRef, useState } from "react"
// import { getCinemaBlobUrl } from "@/store/cinemaFile"
// import style from "./WatchPage.module.scss"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { setCinemaHall } from "@/store/slices/cinemaHallSlice"
// // import { useSocket } from "@/hooks/useSocket" // твой хук

// type WebTorrentInstance = any
// type TorrentInstance = any

// export default function WatchPage() {
//   const { id } = useParams() as { id: string }
//   const dispatch = useAppDispatch()

//   const socket = useSocket()
//   // const [hall, setHall] = useState(null)

//   const cinemaHallName = useAppSelector(
//     (state) => state.cinemaHall.cinemaHallTarget.cinemaHallName,
//   )
//   const hallFile = useAppSelector(
//     (state) => state.cinemaHall.cinemaHallTarget.file,
//   )
//   const [blobUrl, setBlobUrl] = useState<string | null>(null)

//   const [currentTime, setCurrentTime] = useState(0)
//   const [duration, setDuration] = useState(0)

//   const [magnetInput, setMagnetInput] = useState("") // для ручного ввода
//   const [torrentStatus, setTorrentStatus] = useState<
//     "idle" | "connecting" | "buffering" | "ready" | "error"
//   >("idle")
//   const [bufferProgress, setBufferProgress] = useState(0) // 0–100%
//   const clientRef = useRef<WebTorrentInstance>(null)
//   const torrentRef = useRef<TorrentInstance>(null)

//   useEffect(() => {
//     let client: WebTorrentInstance | null = null

//     // Динамически импортируем библиотеку ТОЛЬКО в браузере
//     const initClient = async () => {
//       try {
//         // const WebTorrent = await import("webtorrent")

//         const config = {
//           dht: false,
//           webSeeds: false,
//           tracker: false,
//         }

//         const WebTorrentModule =
//           await import("webtorrent/dist/webtorrent.min.js")

//         const WebTorrent = WebTorrentModule.default || WebTorrentModule

//         client = new WebTorrent(config) // Обратите внимание: .default при динамическом импорте
//         clientRef.current = client
//       } catch (err) {
//         console.error("Failed to load WebTorrent:", err)
//       }
//     }

//     initClient()

//     // Cleanup при размонтировании
//     return () => {
//       if (client) {
//         client.destroy()
//       }
//       clientRef.current = null

//       torrentRef.current?.destroy()
//       torrentRef.current = null
//       if (blobUrl) URL.revokeObjectURL(blobUrl)
//     }
//   }, [])

//   const handleNewBlobUrl = (newUrl: string) => {
//     if (blobUrl) {
//       URL.revokeObjectURL(blobUrl)
//     }
//     setBlobUrl(newUrl)
//   }
//   // Подключение к magnet
//   const handleConnectMagnet = useCallback(() => {
//     if (!clientRef.current || !magnetInput) return

//     setTorrentStatus("connecting")

//     const torrent = clientRef.current.add(magnetInput, {
//       strategy: "sequential",
//     })

//     torrentRef.current = torrent

//     // Обработчики с отпиской
//     const onMetadata = async () => {
//       const videoFile = torrent.files?.find(
//         (f: any) =>
//           f.name.endsWith(".mp4") ||
//           f.name.endsWith(".mkv") ||
//           f.name.endsWith(".webm"),
//       )
//       if (!videoFile) {
//         setTorrentStatus("error")
//         return
//       }

//       try {
//         // ✅ Получаем Blob для видео
//         const blob = await videoFile.getBlob() // или через stream(), если getBlob нет
//         const url = URL.createObjectURL(blob)

//         // ✅ Очищаем старую ссылку
//         if (blobUrl) URL.revokeObjectURL(blobUrl)

//         setBlobUrl(url)
//         setTorrentStatus("buffering")
//       } catch (err) {
//         console.error("Failed to create blob:", err)
//         setTorrentStatus("error")
//       }
//     }

//     const onDownload = () => {
//       const progress = Math.round(torrent.progress * 100)
//       setBufferProgress(progress)
//       if (progress > 10 && torrentStatus === "buffering") {
//         setTorrentStatus("ready")
//       }
//     }

//     const onError = (err: Error) => {
//       console.error("Torrent error:", err)
//       setTorrentStatus("error")
//     }

//     torrent.on("metadata", onMetadata)
//     torrent.on("download", onDownload)
//     torrent.on("error", onError)

//     // Таймаут на отсутствие пиров
//     const timeout = setTimeout(() => {
//       if (torrent.numPeers === 0 && torrentStatus === "connecting") {
//         setTorrentStatus("error")
//       }
//     }, 30000)

//     // Cleanup для этого torrent
//     return () => {
//       clearTimeout(timeout)
//       torrent.off("metadata", onMetadata)
//       torrent.off("download", onDownload)
//       torrent.off("error", onError)
//     }
//   }, [magnetInput, blobUrl, torrentStatus])
//   // const handleConnectMagnet = () => {
//   //   if (!clientRef.current || !magnetInput) return

//   //   setTorrentStatus("connecting")

//   //   const torrent = clientRef.current.add(magnetInput, {
//   //     // Последовательная загрузка для стриминга
//   //     strategy: "sequential",
//   //   })

//   //   torrentRef.current = torrent

//   //   // Когда известны метаданные (список файлов)
//   //   torrent.on("metadata", () => {
//   //     const videoFile = torrent.files.find(
//   //       (f: any) => f.name.endsWith(".mp4") || f.name.endsWith(".mkv"),
//   //     )
//   //     if (!videoFile) {
//   //       setTorrentStatus("error")
//   //       return
//   //     }

//   //     // Создаём поток для <video>
//   //     videoFile.createStream((err, stream) => {
//   //       if (err) {
//   //         setTorrentStatus("error")
//   //         return
//   //       }
//   //       const url = URL.createObjectURL(stream as Blob)
//   //       handleNewBlobUrl(url)
//   //       // setBlobUrl(url)
//   //       setTorrentStatus("buffering")
//   //     })
//   //   })

//   //   // Прогресс загрузки (для отображения буферизации)
//   //   torrent.on("download", () => {
//   //     const progress = Math.round(torrent.progress * 100)
//   //     setBufferProgress(progress)
//   //     // Если буфер заполнен достаточно для старта
//   //     if (progress > 10 && torrentStatus === "buffering") {
//   //       setTorrentStatus("ready")
//   //     }
//   //   })

//   //   torrent.on("error", (err: Error) => {
//   //     console.error("Torrent error:", err)
//   //     setTorrentStatus("error")
//   //   })
//   // }

//   const videoRef = useRef<HTMLVideoElement>(null)

//   useEffect(() => {
//     if (!socket || !id) return
//     console.log("На странице до join:", getCinemaBlobUrl()) // null?
//     // запрашиваем данные комнаты
//     socket.emit("cinema-hall:join", { cinemaHallId: id }, (data) => {
//       if (data.error) {
//         // нет доступа или комната не найдена
//         console.error(data.error)
//         return
//       }
//       dispatch(setCinemaHall(data.hall))
//       // setHall(data.hall)

//       const url = getCinemaBlobUrl()
//       //   console.log("WatchPage url", url)
//       if (url) {
//         // setBlobUrl(url)
//         handleNewBlobUrl(url)
//       }
//     })

//     return () => {
//       // выходим из комнаты когда уходим со страницы
//       socket.emit("cinema-hall:leave", { cinemaHallId: id })
//     }
//   }, [socket, id])

//   useEffect(() => {
//     let isMounted = true

//     const onMetadata = () => {
//       /* ... */
//     }
//     const onDownload = () => {
//       /* ... */
//     }
//     const onError = () => {
//       /* ... */
//     }

//     torrent.on("metadata", onMetadata)
//     torrent.on("download", onDownload)
//     torrent.on("error", onError)

//     return () => {
//       isMounted = false
//       torrent.off("metadata", onMetadata)
//       torrent.off("download", onDownload)
//       torrent.off("error", onError)
//     }
//   }, [torrent])

//   if (!cinemaHallName) return <div>Загрузка...</div>

//   // файл есть — показываем плеер
//   // if (blobUrl) {
//   //   return (
//   //     <div className={style.watchPage}>
//   //       <h1>{cinemaHallName}</h1>
//   //       <div className={style.watchPage__containerVideo}>
//   //         <video
//   //           ref={videoRef}
//   //           src={blobUrl}
//   //           controls
//   //           style={{ width: "100%" }}
//   //           onLoadedMetadata={() =>
//   //             setDuration(videoRef.current?.duration || 0)
//   //           }
//   //           onTimeUpdate={() => {
//   //             console.log(
//   //               "videoRef.current?.currentTime",
//   //               videoRef.current?.currentTime,
//   //             )
//   //             setCurrentTime(videoRef.current?.currentTime || 0)
//   //           }}
//   //         />
//   //       </div>
//   //       <button onClick={() => videoRef.current?.play()}>▶</button>
//   //       <button onClick={() => videoRef.current?.pause()}>⏸</button>
//   //       <input
//   //         type="range"
//   //         min={0}
//   //         max={duration}
//   //         value={currentTime}
//   //         onChange={(e) => {
//   //           const time = Number(e.target.value)
//   //           if (videoRef.current) videoRef.current.currentTime = time
//   //           setCurrentTime(time)
//   //           // videoRef.current.currentTime = Number(e.target.value)
//   //         }}
//   //       />
//   //     </div>
//   //   )
//   // }

//   // файла нет — просим открыть
//   return (
//     <>
//       {torrentStatus === "ready" && blobUrl && (
//         <video
//           ref={videoRef}
//           src={blobUrl}
//           controls
//           autoPlay
//           onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
//           onTimeUpdate={() =>
//             setCurrentTime(videoRef.current?.currentTime || 0)
//           }
//         />
//       )}

//       {torrentStatus === "idle" && (
//         <div>
//           <h2>Подключиться к комнате</h2>
//           <input
//             type="text"
//             placeholder="Вставьте magnet-ссылку..."
//             value={magnetInput}
//             onChange={(e) => setMagnetInput(e.target.value)}
//             style={{ width: "100%", padding: "8px" }}
//           />
//           <button
//             onClick={handleConnectMagnet}
//             disabled={!magnetInput.startsWith("magnet:?")}
//           >
//             Подключиться
//           </button>
//         </div>
//       )}

//       {torrentStatus === "connecting" && <p>🔍 Поиск пиров...</p>}
//       {torrentStatus === "buffering" && (
//         <p>⏳ Буферизация: {bufferProgress}%</p>
//       )}
//       {torrentStatus === "error" && (
//         <p>❌ Ошибка подключения. Проверьте magnet-ссылку.</p>
//       )}
//     </>
//   )
// }
