"use client"
import { useSocket } from "@/providers/SocketProvider"
import { useParams, useSearchParams } from "next/navigation"
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import style from "./WatchPage.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  clearCinemaHall,
  getPeerId,
  joinUser,
  leftUser,
  setCinemaHall,
} from "@/store/slices/cinemaHallSlice"
import ButtonMenu from "@/components/ui/button/Button"
import Spinner from "@/components/ui/spinner/Spinner"
import { initWebTorrentWithSW } from "@/lib/webtorrent-sw"
import {
  CinemaHallTargetType,
  ParticipantsType,
} from "@/types/cinemaHall.types"
import {
  TorrentFile,
  TorrentInstance,
  TorrentStatus,
  WebTorrentInstance,
} from "@/types/webtorrent.types"
import { useCinemaHallSync } from "@/hooks/useCinemaHallSync"
import { TorrentStatsPanel } from "@/components/TorrentStatsPanel/TorrentStatsPanel"
import { VideoAndChatContainer } from "@/components/VideoAndChatContainer/VideoAndChatContainer"
import { CloudinaryImage } from "@/components/CloudinaryImage/CloudinaryImage"
import { calculateSeedingDelay } from "@/utils/calculateSeedingDelay"
import { UserIcon } from "@/assets/icons/userIcon"
import { UserWaiting } from "@/assets/icons/userWaiting"

// Исправление: передавать AbortSignal
function waitForClient(
  clientRef: React.RefObject<WebTorrentInstance | null>,
  signal?: AbortSignal,
  timeoutMs = 10000,
): Promise<WebTorrentInstance> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error("Aborted"))
    if (clientRef.current) return resolve(clientRef.current)
    const start = Date.now()
    const interval = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(interval)
        return reject(new Error("Aborted"))
      }
      if (clientRef.current) {
        clearInterval(interval)
        resolve(clientRef.current)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval)
        reject(new Error("Timeout"))
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
    announce: TRACKERS, // ← ДОБАВИТЬ ЭТУ СТРОКУ
    rtcConfig: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
      ],
    },
  },
} as const

// const ICE_SERVERS = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     { urls: "stun:stun1.l.google.com:19302" },
//     { urls: "stun:stun.cloudflare.com:3478" },
//   ],
// }

export default function WatchPage() {
  const { id } = useParams() as { id: string }
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
  const [bufferingStatus, setBufferingStatus] = useState<boolean>(false)
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

  useEffect(() => {
    return () => {
      if (peerCheckRef.current) clearInterval(peerCheckRef.current)

      abortControllerRef.current?.abort()

      const torrent = torrentRef.current
      if (torrent) torrent.removeAllListeners()
    }
  }, [])

  useEffect(() => {
    async function deleteTorrentFiles(hash: string): Promise<void> {
      try {
        const root = await navigator.storage.getDirectory()
        const shortHash = hash.slice(0, 8)

        // Ищем папку которая заканчивается на наш hash
        // @ts-ignore
        for await (const name of root.keys()) {
          if ((name as string).endsWith(shortHash)) {
            try {
              await root.removeEntry(name, { recursive: true })
              console.log(`✅ Удалено: ${name}`)
            } catch (e) {
              // NoModificationAllowedError — файл уже удалён WebTorrent'ом, игнорируем
              if (
                e instanceof DOMException &&
                e.name === "NoModificationAllowedError"
              )
                return
              throw e
            }

            // await root.removeEntry(name, { recursive: true })
            // console.log(`✅ Удалено: ${name}`)
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
    // const ac = new AbortController()
    // abortControllerRef.current = ac // ← сохраняем

    socket.emit(
      "cinema-hall:join",
      { cinemaHallId: id, groupId, username, avatar },
      async (data: JoinHallResponse) => {
        if (data.error) {
          console.error(data.error)
          return
        }

        dispatch(setCinemaHall(data.hall))
        activate()
        // Зритель: если в зале уже есть magnet — подключаемся
        if (data.hall?.file?.magnet) {
          try {
            // setMagnetURI(data.hall?.file?.magnet)
            setTorrentStatus("connecting")

            const client = await waitForClient(clientRef)
            // const client = await waitForClient(clientRef, ac.signal)

            await connectMagnet(client, data.hall.file.magnet)
            socket.emit("cinema-hall:set-peer-id", {
              cinemaHallId: id,
              groupId,
              peerId: client.peerId,
            })
          } catch (err) {
            console.error("Ошибка подключения:", err)
            setTorrentStatus("error")
          }
        }
      },
    )

    const handleUnload = () => {
      socket.emit("cinema-hall:leave", { cinemaHallId: id, groupId })
    }
    window.addEventListener("beforeunload", handleUnload)

    return () => {
      // abortControllerRef.current?.abort()
      window.removeEventListener("beforeunload", handleUnload)
      socket.emit("cinema-hall:leave", { cinemaHallId: id, groupId })
      dispatch(clearCinemaHall())
    }
  }, [socket, id, groupId]) // dispatch, groupId стабильны

  // ─── Настройка плеера для торрента (универсальная) ───────────────────────────
  const setupTorrentPlayer = (
    torrent: TorrentInstance,
    existingPeerIds: string[] = [],
  ) => {
    torrentRef.current = torrent
    torrentInfoHashRef.current = torrent.infoHash

    existingPeerIds.forEach((peerId) => {
      console.log("🔗 Добавляем пира:", peerId)
      const result = torrent.addPeer(peerId)
      console.log("🔗 addPeer результат:", result) // true/false — сработало или нет
    })

    // Отладка пиров
    peerCheckRef.current = setInterval(() => {
      if (!torrentRef.current && peerCheckRef.current) {
        clearInterval(peerCheckRef.current)
        return
      }
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
      setBufferingStatus(percent < 100)
    })

    // @ts-ignore
    torrent.on("wire", (wire, addr: string) => {
      // console.log(`🔗 Пир: ${addr}, тип: ${wire.type}`)
      console.log(
        `✅ СОЕДИНЕНИЕ УСТАНОВЛЕНО! Пир: ${addr}, тип: ${wire.type}, peerId: ${wire.peerId}`,
      )
      if (peerCheckRef.current) {
        clearInterval(peerCheckRef.current)
      }
    })

    torrent.on("noPeers", () => {
      // console.warn("⚠️ Нет пиров")
      console.warn("❌ Нет пиров — addPeer не сработал")
    })

    torrent.on("warning", (err) => {
      console.warn("⚠️", err)
      if (peerCheckRef.current) {
        clearInterval(peerCheckRef.current)
      }
    })
    torrent.on("error", (err) => {
      console.error("❌", err)
      setTorrentStatus("error")
      if (peerCheckRef.current) {
        clearInterval(peerCheckRef.current)
      }
    })

    const startPlayer = () => {
      // console.log("=== DEBUG: Torrent Ready ===")
      // console.log("Name:", torrent.name)
      // console.log("Progress:", torrent.progress)
      // console.log("Downloaded:", torrent.downloaded, "of", torrent.length)

      const videoFile = (torrent.files as TorrentFile[]).find((f) =>
        VIDEO_EXTENSIONS.some((ext) => f.name.endsWith(ext)),
      )

      if (!videoFile) {
        console.error("Видеофайл не найден в торренте")
        setTorrentStatus("error")
        return
      }
      // console.log("videoRef.current", videoRef.current)
      if (!videoRef.current) return

      // console.log(
      //   "videoFile?.streamTo изменение на ready",
      //   !!videoFile?.streamTo,
      // )
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
      // console.log("⚡ Торрент УЖЕ готов, запускаем плеер немедленно")
      startPlayer()
    } else {
      // Иначе ждём событие ready как обычно
      // console.log("⏳ Ждём события ready...")
      torrent.on("ready", () => {
        // console.log("✅ Событие ready сработало")
        startPlayer()
      })
    }
  }

  useEffect(() => {
    if (!socket) return
    const joinUserHandler = (data: ParticipantsType) => {
      dispatch(joinUser(data))
    }
    const leftUserHandler = (data: { userId: string }) => {
      dispatch(leftUser(data.userId))
    }
    socket?.on("cinema-hall:user-joined", joinUserHandler)
    socket?.on("cinema-hall:user-left", leftUserHandler)

    return () => {
      socket?.off("cinema-hall:user-joined", joinUserHandler)
      socket?.off("cinema-hall:user-left", leftUserHandler)
    }
  }, [socket, dispatch])

  useEffect(() => {
    if (!socket) return
    const getPeerIdHandler = (data: { user: ParticipantsType }) => {
      dispatch(getPeerId(data.user))

      // ← НОВОЕ: если мы хост и у нас есть торрент — добавляем пира напрямую
      const torrent = torrentRef.current
      if (!torrent) return
    }
    socket.on("cinema-hall:get-peer-id", getPeerIdHandler)

    return () => {
      socket.off("cinema-hall:get-peer-id", getPeerIdHandler)
    }
  }, [socket, dispatch])

  const connectMagnet = async (
    client: WebTorrentInstance,
    magnet: string,
    existingPeerIds: string[] = [],
  ) => {
    // console.log("connectMagnet:", magnet)

    // 1. Парсим infoHash из magnet ссылки (формат: ...btih:HASH&...)
    const hashMatch = magnet.match(/btih:([a-zA-Z0-9]+)/)
    if (!hashMatch) {
      console.error("Не удалось извлечь infoHash из magnet")
      return
    }
    const infoHash = hashMatch[1]

    // 2. Проверяем, не качаем ли мы это уже
    const existing = client.torrents.find(
      (t: TorrentInstance) => t.infoHash === infoHash,
    )

    if (existing) {
      // console.log("✅ Торрент уже добавлен, используем существующий")
      setupTorrentPlayer(existing, existingPeerIds)
      return
    }

    // 3. Добавляем новый
    const torrent = client.add(magnet, { announce: TRACKERS })

    if (torrent.ready) {
      setupTorrentPlayer(torrent, existingPeerIds)
    } else {
      torrent.on("ready", () => setupTorrentPlayer(torrent, existingPeerIds))
    }
  }

  // ─── Хеширование файла хостом ────────────────────────────────────────────────
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
    console.log("Что тут в кнопке")
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
            setTorrentStatus("ready")
          }

          // setupTorrentPlayer(torrentRef.current)
        }
        // initClient()
      },
    )
  }

  useEffect(() => {
    return () => {
      if (peerCheckRef.current) {
        clearInterval(peerCheckRef.current)
      }

      abortControllerRef.current?.abort()

      const torrent = torrentRef.current
      if (torrent) {
        torrent.removeAllListeners() // WebTorrent API
        // или по-отдельности: torrent.off('download', onDownload)
      }
    }
  }, [])

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

  return (
    <>
      {!cinemaHallName && (
        <div className={style.createCinemaHallModal}>
          <div
            className={style.createCinemaHallModal__container}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Создать кинозал:</h3>
            <div className={style.createCinemaHallModal__inputName}>
              <label htmlFor="movie-name">Название фильма:</label>
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
              <div className={style.hashingStatus}>
                <Spinner />
                <span>Подготовка файла к раздаче...</span>
                <span className={style.hint}>
                  Чем больше файл, тем дольше это займёт
                </span>
              </div>
            )}
            {isFilePrepared && !isSeedingActive && file && (
              <div className={style.statusReady}>
                <Spinner />
                <span>
                  Файл обработан. Готовим раздачу...
                  <br />
                  <small>
                    ~{Math.round(calculateSeedingDelay(file.size) / 1000)} сек (
                    {(file.size / 1024 / 1024 / 1024).toFixed(1)} ГБ)
                  </small>
                </span>
              </div>
            )}

            {isSeedingActive && (
              <div className={style.statusReady}>
                ✅ Раздача стабильна. Можно создавать кинозал!
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={handleInputChange}
            />

            <div className={style.createCinemaHallModal__buttonContainer}>
              <ButtonMenu disabled={!canCreateHall} onClick={createHandle}>
                Создать Кинозал
              </ButtonMenu>
              <ButtonMenu
                onClick={() => {
                  history.back()
                }}
              >
                Отмена
              </ButtonMenu>
            </div>
          </div>
        </div>
      )}

      <div className={style.watchPage}>
        <VideoAndChatContainer
          // CinemaVideoPlayer
          videoRef={videoRef}
          className={style.video}
          // Источник
          src={blobUrlRef.current}
          magnet={magnet}
          // 👇 Нативные хендлеры (события видео)
          onNativePlay={handleNativePlay}
          onNativePause={handleNativePause}
          onNativeSeeked={handleSeeked}
          onNativeWaiting={handleWaiting}
          onNativeCanPlay={handleCanPlay}
          // 👇 Хендлеры действий пользователя (кнопки)
          onUserPlay={handlePlayRequest}
          onUserPause={handlePauseRequest}
          onUserSeek={handleSeekRequest}
          // 👇 Управляющие пропсы (от сервера)
          externalPlaying={playing}
          externalTime={currentTime}
          //chat
          cinemaHallId={id}
          groupId={groupId}
          socket={socket}
          isHost={hostId === userId}
        />

        <div className={style.watchPage__userInRoomContainer}>
          <h1>{cinemaHallName}</h1>
          <div className={style.watchPage__userInRoomList}>
            <h4 title="Юзеры в комнате">
              <UserIcon />
            </h4>
            {/* <h4>Юзеры в комнате:</h4> */}
            <ul>
              {roomUsers.map((user) => (
                <li key={user.userId}>
                  <div
                    className={style.watchPage__imgContainer}
                    title={user.username || ""}
                  >
                    <CloudinaryImage
                      src={user.avatar ? user.avatar : "/images/anonym.jpeg"}
                      alt="avatar"
                      width={80}
                      height={80}
                    />
                  </div>
                  {/* <div>{user.username}</div> */}
                </li>
              ))}
            </ul>
          </div>
          <div className={style.watchPage__userInRoomList}>
            <h4 title="Ожидаемые юзеры">
              <UserWaiting />
            </h4>
            {/* <h4>Ожидаемые юзеры:</h4> */}
            <ul>
              {waitingForUsers.map((userId) => {
                // console.log("waitingForUsers", waitingForUsers)
                const user = roomUsers.find((user) => user.userId === userId)
                if (!user) return
                return (
                  <li key={userId}>
                    <div
                      className={style.watchPage__imgContainer}
                      title={user.username || ""}
                    >
                      <CloudinaryImage
                        src={user.avatar ? user.avatar : "/images/anonym.jpeg"}
                        alt="avatar"
                        width={100}
                        height={100}
                      />
                    </div>
                    {/* <div>{user.username}</div> */}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
        {torrentStatus === "ready" && <div>Файл готов к скачке...</div>}
        {torrentStatus === "connecting" && <p>🔍 Поиск пиров...</p>}
        {bufferingStatus && bufferProgress !== 100 ? (
          <p>⏳ Видео загружено на {bufferProgress}%</p>
        ) : (
          <p>Загрузка завершилась</p>
        )}
        {torrentStatus === "error" && <p>❌ Ошибка подключения.</p>}

        <TorrentStatsPanel
          torrentRef={torrentRef}
          className={style.statsPanel}
          collapsed={true} // По умолчанию свёрнута
        />
      </div>
    </>
  )
}
