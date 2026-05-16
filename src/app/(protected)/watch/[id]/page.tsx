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
// import { CinemaHallRoomType } from "@/types/cinemaHall"
import { CinemaHallTargetType } from "@/types/cinemaHall.types"
import {
  TorrentFile,
  // AddTorrentOptions,
  TorrentInstance,
  TorrentStatus,
  WebTorrentInstance,
} from "@/types/webtorrent.types"

// type WebTorrentInstance = any
// type TorrentInstance = any

// ─── Вспомогалка: ждём пока clientRef заполнится ─────────────────────────────
function waitForClient(
  clientRef: React.RefObject<WebTorrentInstance | null>,
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

// ─── Типы для socket callbacks ────────────────────────────────────────────────

interface JoinHallResponse {
  hall: CinemaHallTargetType
  error?: string
}

// ─── Константы ────────────────────────────────────────────────────────────────

const TRACKERS: string[] = [
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.webtorrent.dev",
]

const VIDEO_EXTENSIONS = [".mp4", ".mkv", ".webm"] as const

const WEBTORRENT_CONFIG = {
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
} as const

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
  const [torrentStatus, setTorrentStatus] = useState<TorrentStatus>("idle")
  const [bufferProgress, setBufferProgress] = useState(0)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const clientRef = useRef<WebTorrentInstance | null>(null)
  const torrentRef = useRef<TorrentInstance | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const torrentInfoHashRef = useRef<string | null>(null)
  const lastLoggedProgress = useRef(0)
  const blobUrlRef = useRef<string | null>(null)

  const cinemaHallName = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.cinemaHallName,
  )

  useEffect(() => {
    async function deleteTorrentFiles(hash: string): Promise<void> {
      try {
        const root = await navigator.storage.getDirectory()
        const shortHash = hash.slice(0, 8)

        // Ищем папку которая заканчивается на наш hash
        for await (const [name] of root.entries()) {
          if (name.endsWith(shortHash)) {
            await root.removeEntry(name, { recursive: true })
            console.log(`✅ Удалено: ${name}`)
            return
          }
        }

        console.warn(`⚠️ Папка с hash ${shortHash} не найдена`)
      } catch (e) {
        console.error("❌ Ошибка удаления:", e)
      }
    }

    return () => {
      const hash = torrentInfoHashRef.current
      console.log("hash", hash)
      if (!hash) return

      const shortHash = hash.slice(0, 8)
      deleteTorrentFiles(shortHash)
    }
  }, []) // пустой массив — только при размонтировании

  // cleanup blob movie creater:
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [])

  // ─── 1. Инициализируем WebTorrent ОДИН РАЗ при маунте ──────────────────────
  useEffect(() => {
    let cancelled = false
    const initClient = async () => {
      try {
        const WebTorrentModule =
          await import("webtorrent/dist/webtorrent.min.js")
        const WebTorrent = WebTorrentModule.default || WebTorrentModule

        const client = new WebTorrent(WEBTORRENT_CONFIG)

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

    socket.emit(
      "cinema-hall:join",
      { cinemaHallId: id },
      async (data: JoinHallResponse) => {
        if (data.error) {
          console.error(data.error)
          return
        }

        dispatch(setCinemaHall(data.hall))

        // Зритель: если в зале уже есть magnet — подключаемся
        if (data.hall?.file?.magnet) {
          try {
            // setMagnetURI(data.hall?.file?.magnet)
            setTorrentStatus("connecting")
            const client = await waitForClient(clientRef)
            await connectMagnet(client, data.hall.file.magnet)
          } catch (err) {
            console.error("Ошибка подключения:", err)
            setTorrentStatus("error")
          }
        }
      },
    )

    return () => {
      socket.emit("cinema-hall:leave", { cinemaHallId: id, groupId })
      dispatch(clearCinemaHall())
    }
  }, [socket, id]) // dispatch, groupId стабильны

  // ─── Настройка плеера для торрента (универсальная) ───────────────────────────
  const setupTorrentPlayer = (torrent: TorrentInstance) => {
    torrentRef.current = torrent
    torrentInfoHashRef.current = torrent.infoHash

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
    // @ts-ignore
    torrent.on("wire", (wire, addr: string) => {
      console.log(`🔗 Пир: ${addr}, тип: ${wire.type}`)
      clearInterval(peerCheck)
    })

    torrent.on("noPeers", () => {
      console.warn("⚠️ Нет пиров")
    })

    torrent.on("warning", (err) => console.warn("⚠️", err))
    torrent.on("error", (err) => {
      console.error("❌", err)
      setTorrentStatus("error")
    })

    const startPlayer = () => {
      console.log("=== DEBUG: Torrent Ready ===")
      console.log("Name:", torrent.name)
      console.log("Progress:", torrent.progress)
      console.log("Downloaded:", torrent.downloaded, "of", torrent.length)

      const videoFile = (torrent.files as TorrentFile[]).find((f) =>
        VIDEO_EXTENSIONS.some((ext) => f.name.endsWith(ext)),
      )

      if (!videoFile) {
        console.error("Видеофайл не найден в торренте")
        setTorrentStatus("error")
        return
      }
      console.log("videoRef.current", videoRef.current)
      if (!videoRef.current) return

      if (videoFile?.streamTo) {
        videoFile.streamTo(videoRef.current)
        setTorrentStatus("ready")
      } else {
        console.warn("⚠️ streamTo не определён")
        setTorrentStatus("error")
      }
    }
    // 🎯 ГЛАВНЫЙ ФИКС: Проверяем, не готов ли торрент УЖЕ СЕЙЧАС
    if (torrent.ready) {
      console.log("⚡ Торрент УЖЕ готов, запускаем плеер немедленно")
      startPlayer()
    } else {
      // Иначе ждём событие ready как обычно
      console.log("⏳ Ждём события ready...")
      torrent.on("ready", () => {
        console.log("✅ Событие ready сработало")
        startPlayer()
      })
    }
  }

  // ─── Подключение к торренту для зрителя ─────────────────────────────────────
  const connectMagnet = async (client: WebTorrentInstance, magnet: string) => {
    console.log("connectMagnet:", magnet)

    // Не добавляем дважды
    const existing = await client.get(magnet)
    const torrent =
      existing ??
      client.add(magnet, {
        announce: TRACKERS,
      })

    // ✅ Если торрент уже готов — сразу настраиваем плеер
    if (torrent.ready) {
      setupTorrentPlayer(torrent)
    } else {
      // Иначе ждём ready
      torrent.on("ready", () => setupTorrentPlayer(torrent))
    }
  }

  // ─── Хеширование файла хостом ────────────────────────────────────────────────
  const handleFile = async (f: File) => {
    if (!f.type.startsWith("video/")) return

    setFile(f)
    setIsHashing(true)

    try {
      const client = await waitForClient(clientRef)

      const torrent = client.seed(f, {
        announce: TRACKERS,
      })

      torrentRef.current = torrent

      torrent.on("ready", () => {
        console.log("🧲 Magnet:", torrent.magnetURI)
        setMagnetURI(torrent.magnetURI)
        setIsHashing(false)
        torrentInfoHashRef.current = torrent.infoHash
        // setupTorrentPlayer(torrent)
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
    if (!socket || !file || !magnetURI) return

    socket.emit(
      "cinema-hall:create",
      {
        cinemaHallId: id,
        cinemaHallName: movieName,
        groupId,
        file: { name: file.name, size: file.size, magnet: magnetURI },
      },
      async (data: { hall: CinemaHallTargetType }) => {
        console.log("Зал создан:", data.hall)
        if (torrentRef.current) {
          await dispatch(setCinemaHall(data.hall))

          // Создатель смотрит локальный файл напрямую — без торрента
          if (videoRef.current && file) {
            const blobUrl = URL.createObjectURL(file)
            blobUrlRef.current = blobUrl
            videoRef.current.src = blobUrl
            videoRef.current.play().catch(() => {})
            setTorrentStatus("ready")
          }

          // setupTorrentPlayer(torrentRef.current)
        }
        // initClient()
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
              ? "visible"
              : "hidden",
          height:
            torrentStatus === "buffering" || torrentStatus === "ready"
              ? "auto"
              : "0",
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
