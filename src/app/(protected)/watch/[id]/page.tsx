"use client"
// WatchPage.tsx — исправленная версия

import { useSocket } from "@/providers/SocketProvider"
import { useParams, useSearchParams } from "next/navigation"
import { ChangeEvent, useEffect, useRef, useState } from "react"
import style from "./WatchPage.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { clearCinemaHall, setCinemaHall } from "@/store/slices/cinemaHallSlice"
import ButtonMenu from "@/components/ui/button/Button"
import Spinner from "@/components/ui/spinner/Spinner"
import { initWebTorrentWithSW } from "@/lib/webtorrent-sw"

type WebTorrentInstance = any
type TorrentInstance = any

// ─── Вспомогалка: ждём пока clientRef заполнится ─────────────────────────────
function waitForClient(
  clientRef: React.MutableRefObject<WebTorrentInstance>,
  timeoutMs = 10000,
): Promise<WebTorrentInstance> {
  return new Promise((resolve, reject) => {
    if (clientRef.current) return resolve(clientRef.current)
    const start = Date.now()
    const interval = setInterval(() => {
      if (clientRef.current) {
        clearInterval(interval)
        resolve(clientRef.current)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval)
        reject(new Error("WebTorrent client timeout"))
      }
    }, 100)
  })
}

export default function WatchPage() {
  const { id } = useParams() as { id: string }
  const searchParams = useSearchParams()
  const groupId = searchParams.get("group")

  const dispatch = useAppDispatch()
  const socket = useSocket()

  const [file, setFile] = useState<File | null>(null)
  const [movieName, setMovieName] = useState("")
  const [magnetURI, setMagnetURI] = useState<string | null>(null)
  const [isHashing, setIsHashing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const cinemaHallName = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.cinemaHallName,
  )
  const hostId = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.hostId,
  )
  const userId = useAppSelector((state) => state.auth.userId)

  const [torrentStatus, setTorrentStatus] = useState<
    "idle" | "connecting" | "buffering" | "ready" | "error"
  >("idle")
  const [bufferProgress, setBufferProgress] = useState(0)

  const clientRef = useRef<WebTorrentInstance>(null)
  const torrentRef = useRef<TorrentInstance>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastLoggedProgress = useRef(0)

  // ─── 1. Инициализируем WebTorrent ОДИН РАЗ при маунте ──────────────────────
  useEffect(() => {
    let cancelled = false

    const initClient = async () => {
      try {
        const WebTorrentModule =
          await import("webtorrent/dist/webtorrent.min.js")
        const WebTorrent = WebTorrentModule.default || WebTorrentModule

        const config = {
          dht: false,
          tracker: {
            rtcConfig: {
              iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun.cloudflare.com:3478" },
              ],
            },
          },
        }

        const client = new WebTorrent(config)

        if (cancelled) {
          client.destroy()
          return
        }

        clientRef.current = client

        await initWebTorrentWithSW(client).then((swOk) => {
          if (swOk) console.log("✅ SW готов")
          else console.warn("⚠️ SW не инициализирован")
        })

        console.log("✅ WebTorrent клиент готов")
      } catch (err) {
        console.error("Failed to load WebTorrent:", err)
      }
    }

    initClient()

    return () => {
      cancelled = true
      if (clientRef.current) {
        clientRef.current.destroy()
        clientRef.current = null
      }
      torrentRef.current = null
    }
  }, []) // ← ПУСТОЙ массив! Только один раз

  // ─── 2. Подключение к залу через socket ─────────────────────────────────────
  useEffect(() => {
    if (!socket || !id) return

    socket.emit("cinema-hall:join", { cinemaHallId: id }, async (data: any) => {
      if (data.error) {
        console.error(data.error)
        return
      }

      dispatch(setCinemaHall(data.hall))

      // Зритель: если в зале уже есть magnet — подключаемся
      if (data.hall?.file?.magnet && hostId !== userId) {
        try {
          setTorrentStatus("connecting")
          const client = await waitForClient(clientRef)
          await connectMagnet(client, data.hall.file.magnet)
        } catch (err) {
          console.error("Ошибка подключения:", err)
          setTorrentStatus("error")
        }
      }
    })

    return () => {
      socket.emit("cinema-hall:leave", { cinemaHallId: id, groupId })
      dispatch(clearCinemaHall())
    }
  }, [socket, id]) // dispatch, groupId стабильны

  // ─── 3. Хост: когда зал создан — запускаем его видео локально ───────────────
  useEffect(() => {
    if (cinemaHallName && hostId === userId && file && videoRef.current) {
      if (videoRef.current.src?.startsWith("blob:")) {
        URL.revokeObjectURL(videoRef.current.src)
      }
      // Хост смотрит свой файл напрямую (он уже есть локально)
      videoRef.current.src = URL.createObjectURL(file)
      setTorrentStatus("ready")
    }
  }, [cinemaHallName, hostId, userId, file])

  // ─── Подключение к торренту для зрителя ─────────────────────────────────────
  const connectMagnet = async (client: WebTorrentInstance, magnet: string) => {
    console.log("connectMagnet:", magnet)

    // Не добавляем дважды
    const existing = await client.get(magnet)
    const torrent =
      existing ??
      client.add(magnet, {
        announce: [
          "wss://tracker.openwebtorrent.com",
          "wss://tracker.webtorrent.dev",
        ],
      })

    torrentRef.current = torrent

    // Отладка пиров
    const peerCheck = setInterval(() => {
      if (!torrentRef.current) return clearInterval(peerCheck)
      console.log(`🔍 Пиров: ${torrent.numPeers}`)
    }, 5000)

    torrent.on("metadata", () => {
      console.log(
        "📦 Метаданные:",
        torrent.name,
        torrent.files?.length,
        "файлов",
      )
    })

    torrent.on("wire", (wire: any, addr: string) => {
      console.log(`🔗 Пир: ${addr}, тип: ${wire.type}`)
      clearInterval(peerCheck) // нашли пира — стоп
    })

    torrent.on("noPeers", () => {
      console.warn("⚠️ Нет пиров")
    })

    torrent.on("ready", () => {
      console.log("✅ Торрент готов:", torrent.name)

      // Ищем видеофайл
      const videoFile = torrent.files.find(
        (f: any) =>
          f.name.endsWith(".mp4") ||
          f.name.endsWith(".mkv") ||
          f.name.endsWith(".webm"),
      )

      if (!videoFile) {
        console.error("Видеофайл не найден в торренте")
        setTorrentStatus("error")
        return
      }

      // // ✅ Деселектируем все файлы сначала
      // torrent.files.forEach((f: any) => f.deselect())

      // // ✅ Селектируем только нужный с нормальным приоритетом
      // videoFile.select()

      if (!videoRef.current) return

      // ✅ streamTo — настоящий стриминг без ожидания полной загрузки
      // Требует Service Worker (initWebTorrentWithSW)
      videoFile.streamTo(videoRef.current)
      setTorrentStatus("ready")

      //  ;(window as any).__torrent = torrent
    })

    torrent.on("download", () => {
      const percent = Math.round(torrent.progress * 100)
      if (percent % 5 === 0 && percent !== lastLoggedProgress.current) {
        lastLoggedProgress.current = percent
        console.log(
          `📥 ${percent}% | пиров: ${torrent.numPeers} | ${(torrent.downloadSpeed / 1024).toFixed(1)} KB/s`,
        )
      }
      setBufferProgress(percent)
      if (torrentStatus !== "ready") setTorrentStatus("buffering")
    })

    torrent.on("warning", (err: any) => console.warn("⚠️", err))
    torrent.on("error", (err: any) => {
      console.error("❌", err)
      setTorrentStatus("error")
    })
  }

  // ─── Хеширование файла хостом ────────────────────────────────────────────────
  const handleFile = async (f: File) => {
    if (!f.type.startsWith("video/")) return

    setFile(f)
    setIsHashing(true)

    try {
      const client = await waitForClient(clientRef)

      const torrent = client.seed(f, {
        announce: [
          "wss://tracker.openwebtorrent.com",
          "wss://tracker.webtorrent.dev",
        ],
      })

      torrentRef.current = torrent

      torrent.on("ready", () => {
        console.log("🧲 Magnet:", torrent.magnetURI)
        setMagnetURI(torrent.magnetURI)
        setIsHashing(false)
      })

      torrent.on("error", (err: any) => {
        console.error("Ошибка хэширования:", err)
        setIsHashing(false)
      })
    } catch (err) {
      console.error("Клиент не готов:", err)
      setIsHashing(false)
    }
  }

  const handleDragOver = (e: any) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: any) => {
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
    if (!socket || !file || !magnetURI) return

    socket.emit(
      "cinema-hall:create",
      {
        cinemaHallId: id,
        cinemaHallName: movieName,
        groupId,
        file: { name: file.name, size: file.size, magnet: magnetURI },
      },
      (data: any) => {
        console.log("Зал создан:", data.hall)
        dispatch(setCinemaHall(data.hall))
      },
    )
  }

  // ─── Рендер ──────────────────────────────────────────────────────────────────
  if (!cinemaHallName) {
    return (
      <div className={style.createCinemaHallModal}>
        <div
          className={style.createCinemaHallModal__container}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>Создать кинозал</h3>
          <div>
            <label htmlFor="movie-name">Название фильма</label>
            <input
              placeholder="Введите название..."
              type="text"
              id="movie-name"
              value={movieName}
              onChange={(e) => setMovieName(e.target.value)}
            />
          </div>

          <div
            className={`${style.dropZone} ${isDragging ? style.dropZone__active : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            {file ? (
              <div className={style.fileInfo}>
                <span>{file.name}</span>
                <span>{(file.size / 1024 / 1024 / 1024).toFixed(2)} ГБ</span>
              </div>
            ) : (
              <p>Перетащи файл сюда или нажми чтобы выбрать</p>
            )}
          </div>

          {isHashing && (
            <span>
              Хеширование... <Spinner />
            </span>
          )}
          {magnetURI && !isHashing && <div>✅ Файл готов к раздаче</div>}

          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={handleInputChange}
          />

          <div className={style.createCinemaHallModal__buttonContainer}>
            <ButtonMenu
              disabled={!file || !magnetURI || isHashing}
              onClick={createHandle}
            >
              Создать Кинозал
            </ButtonMenu>
            <ButtonMenu onClick={() => history.back()}>Отмена</ButtonMenu>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={style.watchPage}>
      <h1>{cinemaHallName}</h1>

      <video
        ref={videoRef}
        controls
        style={{
          width: "100%",
          display:
            torrentStatus === "buffering" || torrentStatus === "ready"
              ? "block"
              : "none",
        }}
      />

      <div>Статус: {torrentStatus}</div>
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
// import { useParams, useSearchParams } from "next/navigation"
// import { ChangeEvent, useEffect, useRef, useState } from "react"
// // import { getCinemaBlobUrl } from "@/store/cinemaFile"
// import style from "./WatchPage.module.scss"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { clearCinemaHall, setCinemaHall } from "@/store/slices/cinemaHallSlice"
// import ButtonMenu from "@/components/ui/button/Button"
// import Spinner from "@/components/ui/spinner/Spinner"
// import { initWebTorrentWithSW } from "@/lib/webtorrent-sw"

// type WebTorrentInstance = any
// type TorrentInstance = any

// export default function WatchPage() {
//   const { id } = useParams() as { id: string }
//   const searchParams = useSearchParams()
//   const groupId = searchParams.get("group")

//   const dispatch = useAppDispatch()
//   const socket = useSocket()

//   const [file, setFile] = useState<File | null>(null)
//   const [movieName, setMovieName] = useState("")
//   const [magnetURI, setMagnetURI] = useState<string | null>(null)
//   const [isHashing, setIsHashing] = useState(false)
//   const [isDragging, setIsDragging] = useState(false)
//   const inputRef = useRef<HTMLInputElement>(null)

//   const cinemaHallName = useAppSelector(
//     (state) => state.cinemaHall.cinemaHallTarget.cinemaHallName,
//   )
//   // console.log("cinemaHallName", cinemaHallName)
//   // const cinemaHallId = useAppSelector(
//   //   (state) => state.cinemaHall.cinemaHallTarget.cinemaHallId,
//   // )
//   const hostId = useAppSelector(
//     (state) => state.cinemaHall.cinemaHallTarget.hostId,
//   )
//   const userId = useAppSelector((state) => state.auth.userId)
//   // const groupId = useAppSelector(
//   //   (state) => state.cinemaHall.cinemaHallTarget.groupId,
//   // )

//   const [torrentStatus, setTorrentStatus] = useState<
//     "idle" | "connecting" | "buffering" | "ready" | "error"
//   >("idle")
//   const [bufferProgress, setBufferProgress] = useState(0)
//   // const [blobUrl, setBlobUrl] = useState<string | null>(null)

//   const clientRef = useRef<WebTorrentInstance>(null)
//   const torrentRef = useRef<TorrentInstance>(null)
//   const videoRef = useRef<HTMLVideoElement>(null)

//   const lastLoggedProgress = useRef(0)
//   // const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
//   // const blobUrlRef = useRef<string | null>(null)

//   useEffect(() => {
//     let cancelled = false

//     let client: WebTorrentInstance | null = null

//     // Динамически импортируем библиотеку ТОЛЬКО в браузере
//     const initClient = async () => {
//       try {
//         // const WebTorrent = await import("webtorrent")

//         const config = {
//           dht: false,
//           webSeeds: false,
//           tracker: {
//             rtcConfig: {
//               iceServers: [
//                 { urls: "stun:stun.l.google.com:19302" }, // Бесплатный STUN

//                 { urls: "stun:stun1.l.google.com:19302" },
//                 { urls: "stun:stun2.l.google.com:19302" },
//                 { urls: "stun:stun3.l.google.com:19302" },
//                 { urls: "stun:stun4.l.google.com:19302" },
//                 { urls: "stun:stun.cloudflare.com:3478" },
//                 { urls: "stun:stun.stunprotocol.org:3478" },
//                 { urls: "stun:stun.voip.blackberry.com:3478" },
//                 // {
//                 //   urls: 'turn:your-turn-server.com:3478',
//                 //   username: 'user',
//                 //   credential: 'pass'
//                 // } // Свой TURN для продакшена
//               ],
//             },
//           },
//           // tracker: false,
//         }

//         const WebTorrentModule =
//           await import("webtorrent/dist/webtorrent.min.js")

//         const WebTorrent = WebTorrentModule.default || WebTorrentModule

//         client = new WebTorrent(config) // Обратите внимание: .default при динамическом импорте

//         clientRef.current = client

//         // Инициализируем с воркером
//         await initWebTorrentWithSW(client).then((swOk) => {
//           if (swOk) console.log("✅ SW готов")
//           else console.warn("⚠️ SW не инициализирован, пробуем без него")
//         })

//         if (magnetURI && !cancelled) {
//           const torrent = client.add(magnetURI)
//           torrentRef.current = torrent

//           // 🔥 Логируем пиров каждые 5 секунд, даже до metadata
//           const peerCheck = setInterval(() => {
//             if (cancelled) {
//               clearInterval(peerCheck)
//               return
//             }
//             console.log(
//               `🔍 Поиск пиров... текущее количество: ${torrent.numPeers}`,
//             )
//           }, 5000)

//           attachTorrentHandlers(torrent)
//         }
//       } catch (err) {
//         console.error("Failed to load WebTorrent:", err)
//       }
//     }

//     initClient()

//     // Cleanup при размонтировании
//     return () => {
//       cancelled = true
//       // if (client) {
//       //   client.destroy()
//       // }
//       if (clientRef.current) {
//         clientRef.current.destroy()
//       }
//       clientRef.current = null
//       torrentRef.current = null

//       // torrentRef.current?.destroy()
//     }
//   }, [magnetURI])

//   const connectMagnet = async (magnet: string) => {
//     console.log(
//       "before !clientRef.current || !magnet",
//       !clientRef.current,
//       !magnet,
//     )
//     if (!clientRef.current || !magnet) return
//     console.log("magnet", magnet)

//     const existing = await clientRef.current.get(magnet)
//     console.log("existing", existing)

//     let torrent

//     if (existing) {
//       // Если есть — просто берем его, НЕ создаем новый!
//       torrent = existing
//       console.log("был найден", torrent)
//     } else {
//       try {
//         torrent = clientRef.current.add(magnet)
//         console.log("✅ Торрент создан, infoHash:", torrent.infoHash)
//         console.log("✅ Торрент создан, torrent:", torrent)
//       } catch (err) {
//         console.error("❌ Ошибка при добавлении торрента:", err)
//         setTorrentStatus("error")
//         return
//       }
//     }

//     console.log("🔍 DEBUG torrent:", {
//       ready: torrent.ready, // ← Главное: true или false?
//       files: torrent.files?.length, // ← Сколько файлов видит?
//       firstFileName: torrent.files?.[0]?.name, // ← Имя первого файла
//       hasRenderTo: typeof torrent.files?.[0]?.renderTo, // ← Есть ли метод?
//     })

//     torrentRef.current = torrent

//     torrent.on("metadata", () => {
//       console.log("📦 Метаданные получены:", {
//         infoHash: torrent.infoHash,
//         name: torrent.name,
//         files: torrent.files?.map((f) => ({
//           name: f.name,
//           length: f.length,
//         })),
//         numPeers: torrent.numPeers,
//       })
//     })

//     torrent.on("wire", (wire, addr) => {
//       console.log(`🔗 Подключение к пиру: ${addr}`, {
//         peerId: wire.peerId?.toString("hex"),
//         uploaded: wire.uploaded,
//         downloaded: wire.downloaded,
//         type: wire.type, // 'webrtc' или 'tcp'
//       })
//     })

//     torrent.on("noPeers", () => {
//       console.warn("⚠️ Нет доступных пиров для подключения")
//     })

//     torrent.on("ready", async () => {
//       const file = torrent.files.find((f: any) => f.name.endsWith(".mp4"))
//       if (!file) return

//       console.log("🧪 ТЕСТ P2P: пробуем скачать первые 1 МБ напрямую...")

//       // Скачиваем только первый мегабайт через P2P
//       const stream = file.stream({ start: 0, end: 1024 * 1024 })
//       const reader = stream.getReader()
//       let bytes = 0

//       try {
//         while (true) {
//           const { done, value } = await reader.read()
//           if (done) break
//           bytes += value.length
//           console.log(`📥 Получено: ${bytes} байт`)
//         }
//         console.log("✅ P2P работает! Данные идут через WebRTC.")

//         // Если дошло сюда → проблема ТОЧНО в streamTo / Service Worker
//         // Пробуем воспроизвести весь файл через blob для проверки
//         console.log("🎬 Пробуем воспроизвести через blob()...")
//         const fullBlob = await file.blob()
//         videoRef.current.src = URL.createObjectURL(fullBlob)
//         setTorrentStatus("ready")
//       } catch (err) {
//         console.error("❌ P2P не работает:", err)
//       }
//     })

//     torrent.on("download", () => {
//       // Логируем только каждые 10%, чтобы не спамить
//       const percent = Math.round(torrent.progress * 100)
//       if (percent % 10 === 0 && percent !== lastLoggedProgress.current) {
//         console.log(
//           `📥 Прогресс: ${percent}% | Пиров: ${torrent.numPeers} | Скорость: ${(torrent.downloadSpeed / 1024).toFixed(1)} KB/s`,
//         )
//         lastLoggedProgress.current = percent
//       }
//       setBufferProgress(percent)
//     })

//     torrent.on("upload", () => {
//       console.log(
//         `📤 Раздача: ${(torrent.uploaded / 1024 / 1024).toFixed(2)} MB | Скорость: ${(torrent.uploadSpeed / 1024).toFixed(1)} KB/s`,
//       )
//     })

//     torrent.on("warning", (err) => {
//       console.warn("⚠️ Предупреждение торрента:", err)
//     })

//     torrent.on("error", (err) => {
//       console.error("❌ Ошибка торрента:", err)
//       setTorrentStatus("error")
//     })
//   }

//   useEffect(() => {
//     if (!socket || !id) return

//     socket.emit("cinema-hall:join", { cinemaHallId: id }, (data) => {
//       if (data.error) {
//         // нет доступа или комната не найдена
//         console.error(data.error)
//         return
//       }

//       dispatch(setCinemaHall(data.hall))

//       if (data.hall?.file?.magnet) {
//         connectMagnet(data.hall.file.magnet)
//       }
//     })

//     return () => {
//       // выходим из комнаты когда уходим со страницы
//       socket.emit("cinema-hall:leave", { cinemaHallId: id, groupId })
//       dispatch(clearCinemaHall())
//     }
//   }, [socket, id, dispatch])

//   const attachTorrentHandlers = (torrent: TorrentInstance) => {
//     torrent.on("ready", () => {
//       console.log("✅ Создатель: торрент готов к раздаче", {
//         infoHash: torrent.infoHash,
//         files: torrent.files?.map((f) => ({ name: f.name, length: f.length })),
//         numPeers: torrent.numPeers,
//       })

//       const file = torrent.files.find((f) => f.name.endsWith(".mp4"))
//       if (file && videoRef.current) {
//         console.log("🎬 Запуск streamTo")
//         file.streamTo(videoRef.current)
//         setTorrentStatus("ready")
//       }
//     })

//     // Внутри torrent.on('ready') блока, добавь ещё обработчики:

//     torrent.on("metadata", () => {
//       console.log("📦 Метаданные получены:", {
//         infoHash: torrent.infoHash,
//         name: torrent.name,
//         files: torrent.files?.map((f) => ({
//           name: f.name,
//           length: f.length,
//         })),
//         numPeers: torrent.numPeers,
//       })
//     })

//     torrent.on("wire", (wire, addr) => {
//       console.log(`🔗 Подключение к пиру: ${addr}`, {
//         peerId: wire.peerId?.toString("hex"),
//         uploaded: wire.uploaded,
//         downloaded: wire.downloaded,
//         type: wire.type, // 'webrtc' или 'tcp'
//       })
//     })

//     torrent.on("noPeers", () => {
//       console.warn("⚠️ Нет доступных пиров для подключения")
//     })

//     // torrent.on("ready", () => {
//     //   console.log("✅ Торрент готов:", {
//     //     infoHash: torrent.infoHash,
//     //     progress: Math.round(torrent.progress * 100) + "%",
//     //     downloaded: (torrent.downloaded / 1024 / 1024).toFixed(2) + " MB",
//     //     numPeers: torrent.numPeers,
//     //     downloadSpeed: torrent.downloadSpeed,
//     //   })

//     //   const file = torrent.files.find((f: any) => f.name.endsWith(".mp4"))
//     //   if (file && videoRef.current) {
//     //     console.log("🎬 Запуск streamTo для файла:", file.name)
//     //     file.streamTo(videoRef.current)
//     //     setTorrentStatus("ready")
//     //   }
//     // })

//     torrent.on("download", () => {
//       // Логируем только каждые 10%, чтобы не спамить
//       const percent = Math.round(torrent.progress * 100)
//       if (percent % 10 === 0 && percent !== lastLoggedProgress.current) {
//         console.log(
//           `📥 Прогресс: ${percent}% | Пиров: ${torrent.numPeers} | Скорость: ${(torrent.downloadSpeed / 1024).toFixed(1)} KB/s`,
//         )
//         lastLoggedProgress.current = percent
//       }
//       setBufferProgress(percent)
//     })

//     torrent.on("upload", () => {
//       console.log(
//         `📤 Раздача: ${(torrent.uploaded / 1024 / 1024).toFixed(2)} MB | Скорость: ${(torrent.uploadSpeed / 1024).toFixed(1)} KB/s`,
//       )
//     })

//     torrent.on("warning", (err) => {
//       console.warn("⚠️ Предупреждение торрента:", err)
//     })

//     torrent.on("error", (err) => {
//       console.error("❌ Ошибка торрента:", err)
//       setTorrentStatus("error")
//     })
//   }

//   const handleFile = async (f: File) => {
//     console.log("handleFile start")
//     // проверяем что это видео
//     if (!f.type.startsWith("video/")) return
//     console.log("handleFile  video has")

//     setFile(f)
//     // setCinemaFile(f)

//     // ✅ Добавьте это в начало:
//     setIsHashing(true)
//     // setHashingProgress(0) // сброс прогресса для нового файла

//     // Ждём клиента если ещё не готов
//     let attempts = 0
//     while (!clientRef.current && attempts < 20) {
//       await new Promise((r) => setTimeout(r, 100))
//       attempts++
//     }

//     // Проверяем, что клиент уже инициализирован
//     if (!clientRef.current) {
//       console.error("WebTorrent client not initialized yet")
//       setIsHashing(false)
//       return
//     }

//     const torrent = clientRef.current.seed(
//       f,
//       {
//         announce: [
//           "wss://tracker.openwebtorrent.com",
//           "wss://tracker.webtorrent.dev",
//         ], // без трекеров
//       },
//       (torrent) => {
//         console.log("Magnet:", torrent.magnetURI)
//       },
//     )
//     torrentRef.current = torrent

//     // torrentRef.current = torrent
//     console.log("создался торрент в модалке", torrent)
//     // torrent.on("ready", () => {
//     //   // Файл захэширован, magnet готов!
//     //   setMagnetURI(torrent.magnetURI)
//     //   setIsHashing(false)
//     // })

//     torrent.on("ready", () => {
//       // Файл захэширован, magnet готов!
//       setMagnetURI(torrent.magnetURI)
//       setIsHashing(false)

//       // connectMagnet(torrent.magnetURI)
//     })

//     torrent.on("error", (err) => {
//       // Показываем ошибку пользователю
//       console.error("Ошибка хэширования:", err)
//       setIsHashing(false)
//     })

//     // console.log("После setFile:", getCinemaBlobUrl())
//   }

//   // drag & drop события
//   const handleDragOver = (e: DragEvent) => {
//     e.preventDefault() // без этого drop не сработает
//     setIsDragging(true)
//   }

//   const handleDragLeave = () => setIsDragging(false)

//   const handleDrop = (e: DragEvent) => {
//     e.preventDefault()
//     setIsDragging(false)
//     const dropped = e.dataTransfer.files[0]
//     if (dropped) handleFile(dropped)
//   }

//   // обычный input
//   const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const selected = e.target.files?.[0]
//     if (selected) handleFile(selected)
//   }

//   const createHandle = () => {
//     if (!socket || !file) return
//     socket.emit(
//       "cinema-hall:create",
//       {
//         cinemaHallId: id,
//         cinemaHallName: movieName,
//         groupId,
//         file: {
//           name: file.name,
//           size: file.size,
//           magnet: magnetURI,
//         },
//       },
//       (data: any) => {
//         console.log("createHandle", data.hall)
//         dispatch(setCinemaHall(data.hall))
//         // tryRenderVideo()
//         // connectMagnet(data.hall.file.magnet)
//         // router.push(`/watch/${data.cinemaHallId}`)
//       },
//     )
//   }

//   useEffect(() => {
//     // Проверяем оба условия
//     if (cinemaHallName && hostId === userId) {
//       if (file && videoRef.current) {
//         if (videoRef.current.src?.startsWith("blob:")) {
//           URL.revokeObjectURL(videoRef.current.src)
//         }
//         videoRef.current.src = URL.createObjectURL(file)
//         setTorrentStatus("ready")
//       }
//     }
//   }, [cinemaHallName])

//   if (!cinemaHallName) {
//     return (
//       <div className={style.createCinemaHallModal}>
//         <div
//           className={style.createCinemaHallModal__container}
//           onClick={(e) => e.stopPropagation()}
//         >
//           <h3>Создать кинозал</h3>
//           <div>
//             <label htmlFor="movie-name">Название фильма</label>{" "}
//             <input
//               placeholder="Введите название..."
//               type="text"
//               id="movie-name"
//               value={movieName}
//               onChange={(e) => setMovieName(e.target.value)}
//             />
//           </div>

//           {/* drop зона */}
//           <div
//             className={`${style.dropZone} ${isDragging ? style.dropZone__active : ""}`}
//             onDragOver={handleDragOver}
//             onDragLeave={handleDragLeave}
//             onDrop={handleDrop}
//             onClick={() => inputRef.current?.click()} // клик на зону = открыть диалог
//           >
//             {file ? (
//               <div className={style.fileInfo}>
//                 <span>{file.name}</span>
//                 <span>{(file.size / 1024 / 1024 / 1024).toFixed(2)} ГБ</span>
//               </div>
//             ) : (
//               <p>Перетащи файл сюда или нажми чтобы выбрать</p>
//             )}
//           </div>
//           {isHashing && (
//             <span>
//               прогресс хеширования пожалуйства подождите это может занять
//               немного времени <Spinner />
//             </span>
//           )}
//           {magnetURI && !isHashing && <div>Файл загружен</div>}
//           {/* скрытый input */}
//           <input
//             ref={inputRef}
//             type="file"
//             accept="video/*"
//             style={{ display: "none" }}
//             onChange={handleInputChange}
//           />
//           <div className={style.createCinemaHallModal__buttonContainer}>
//             <ButtonMenu
//               disabled={!file || !magnetURI || isHashing}
//               onClick={createHandle}
//             >
//               Создать Кинозал
//             </ButtonMenu>
//             <ButtonMenu
//               onClick={() => {
//                 history.back()
//               }}
//             >
//               Отмена
//             </ButtonMenu>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className={style.watchPage}>
//       <h1>{cinemaHallName}</h1>

//       {/* Video всегда в DOM чтобы renderTo мог найти элемент */}
//       <video
//         ref={videoRef}
//         // src={blobUrl ?? undefined}
//         controls
//         style={{
//           width: "100%",
//           display:
//             torrentStatus === "buffering" || torrentStatus === "ready"
//               ? "block"
//               : "none",
//         }}
//       />
//       <div>Статус: {torrentStatus}</div>

//       {/* <div>magnet url: {blobUrl}</div> */}
//       {torrentStatus === "connecting" && <p>🔍 Поиск пиров...</p>}
//       {torrentStatus === "buffering" && (
//         <p>⏳ Буферизация: {bufferProgress}%</p>
//       )}
//       {torrentStatus === "error" && <p>❌ Ошибка подключения.</p>}
//     </div>
//   )
// }
