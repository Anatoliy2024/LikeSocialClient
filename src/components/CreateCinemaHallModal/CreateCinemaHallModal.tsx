"use client"
import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react"
import style from "./CreateCinemaHallModal.module.scss"
import ButtonMenu from "../ui/button/Button"
import { useSocket } from "@/providers/SocketProvider"
import {
  clearCinemaFile,
  // getCinemaBlobUrl,
  setCinemaFile,
} from "@/store/cinemaFile"
import { useRouter } from "next/navigation"
import Spinner from "../ui/spinner/Spinner"
// import WebTorrent from "webtorrent"

type WebTorrentInstance = any
type TorrentInstance = any

export const CreateCinemaHallModal = ({
  handleCloseCreateCinemaHallModal,
  groupId,
}: {
  handleCloseCreateCinemaHallModal: () => void
  groupId: string
}) => {
  const router = useRouter()
  const [cinemaHallName, setCinemaHallName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const socket = useSocket()
  const inputRef = useRef<HTMLInputElement>(null)

  const clientRef = useRef<WebTorrentInstance>(null)
  const torrentRef = useRef<TorrentInstance>(null)
  // const [hashingProgress, setHashingProgress] = useState(0)
  const [magnetURI, setMagnetURI] = useState<string | null>(null)
  const [isHashing, setIsHashing] = useState(false)

  useEffect(() => {
    let client: WebTorrentInstance | null = null

    // Динамически импортируем библиотеку ТОЛЬКО в браузере
    const initClient = async () => {
      try {
        // const WebTorrent = await import("webtorrent")

        const config = {
          dht: false,
          webSeeds: false,
          // tracker: false,
        }

        const WebTorrentModule =
          await import("webtorrent/dist/webtorrent.min.js")

        const WebTorrent = WebTorrentModule.default || WebTorrentModule

        client = new WebTorrent(config) // Обратите внимание: .default при динамическом импорте
        clientRef.current = client
      } catch (err) {
        console.error("Failed to load WebTorrent:", err)
      }
    }

    initClient()

    // Cleanup при размонтировании
    return () => {
      if (client) {
        client.destroy()
      }
      clientRef.current = null

      torrentRef.current?.destroy()
      torrentRef.current = null
    }
  }, [])

  // useEffect(() => {
  //   const config = {
  //     dht: false,
  //     webSeeds: false,
  //     tracker: {
  //       announce: [],
  //     },
  //   }
  //   const client = new WebTorrent(config)
  //   clientRef.current = client

  //   return () => {
  //     // 1. Сначала убиваем активный торрент (если есть)
  //     torrentRef.current?.destroy()

  //     // 2. Потом убиваем клиента (закрывает ВСЕ соединения)
  //     clientRef.current?.destroy()

  //     // 3. Чистим рефы (опционально, но аккуратно)
  //     torrentRef.current = null
  //     clientRef.current = null
  //   }
  // }, [])

  const handleFile = async (f: File) => {
    // проверяем что это видео
    if (!f.type.startsWith("video/")) return
    setFile(f)
    setCinemaFile(f)

    // ✅ Добавьте это в начало:
    setIsHashing(true)
    // setHashingProgress(0) // сброс прогресса для нового файла

    // Ждём клиента если ещё не готов
    let attempts = 0
    while (!clientRef.current && attempts < 20) {
      await new Promise((r) => setTimeout(r, 100))
      attempts++
    }

    // Проверяем, что клиент уже инициализирован
    if (!clientRef.current) {
      console.error("WebTorrent client not initialized yet")
      setIsHashing(false)
      return
    }

    if (torrentRef.current) {
      torrentRef.current?.destroy()
      torrentRef.current = null
    }

    const torrent = clientRef.current.seed(
      f,
      {
        announce: [
          "wss://tracker.openwebtorrent.com",
          "wss://tracker.webtorrent.dev",
        ], // без трекеров
      },
      (torrent) => {
        console.log("Magnet:", torrent.magnetURI)
      },
    )
    torrentRef.current = torrent
    torrent.on("ready", () => {
      // Файл захэширован, magnet готов!
      setMagnetURI(torrent.magnetURI)
      setIsHashing(false)
    })

    // torrent.on("download", () => {
    //   if (torrent.pieces) {
    //     const progress = Math.round(torrent.progress * 100)
    //     setHashingProgress(progress)
    //   }
    // })

    // // Прогресс хэширования — через done кусков
    // torrent.on("verified", () => {
    //   const progress = torrent.pieces
    //     ? Math.round((torrent.verified / torrent.pieces.length) * 100)
    //     : 0
    //   setHashingProgress(progress)
    // })

    // torrent.on("progress", (progress) => {
    //   // Обновляем прогресс-бар (0.0 → 1.0)
    //   setHashingProgress(Math.round(progress * 100))
    // })

    torrent.on("error", (err) => {
      // Показываем ошибку пользователю
      console.error("Ошибка хэширования:", err)
      setIsHashing(false)
    })

    // console.log("После setFile:", getCinemaBlobUrl())
  }

  // drag & drop события
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault() // без этого drop не сработает
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  // обычный input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleFile(selected)
  }

  const createHandle = () => {
    if (!socket || !file) return
    socket.emit(
      "cinema-hall:create",
      {
        cinemaHallName,
        groupId,
        file: {
          name: file.name,
          size: file.size,
          magnet: magnetURI,
        },
      },
      (data: any) => {
        router.push(`/watch/${data.cinemaHallId}`)
      },
    )
  }
  const handleCloseModal = () => {
    clearCinemaFile()
    handleCloseCreateCinemaHallModal()
  }

  return (
    <div className={style.createCinemaHallModal} onClick={handleCloseModal}>
      <div
        className={style.createCinemaHallModal__container}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Создать кинозал</h3>
        <div>
          <label htmlFor="movie-name">Название фильма</label>{" "}
          <input
            placeholder="Введите название..."
            type="text"
            id="movie-name"
            value={cinemaHallName}
            onChange={(e) => setCinemaHallName(e.target.value)}
          />
        </div>

        {/* drop зона */}
        <div
          className={`${style.dropZone} ${isDragging ? style.dropZone__active : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()} // клик на зону = открыть диалог
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
            прогресс хеширования пожалуйства подождите это может занять немного
            времени <Spinner />
          </span>
        )}
        {magnetURI && !isHashing && <div>Файл загружен</div>}
        {/* скрытый input */}
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
          <ButtonMenu onClick={handleCloseModal}>Отмена</ButtonMenu>
        </div>
      </div>
    </div>
  )
}
