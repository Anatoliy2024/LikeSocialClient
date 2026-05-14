"use client"
import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react"
import style from "./CreateCinemaHallModal.module.scss"
import ButtonMenu from "../ui/button/Button"
import { useSocket } from "@/providers/SocketProvider"
// import {
//   clearCinemaFile,
//   // getCinemaBlobUrl,
//   setCinemaFile,
// } from "@/store/cinemaFile"
import { useRouter } from "next/navigation"
import Spinner from "../ui/spinner/Spinner"
// import WebTorrent from "webtorrent"

// import { useTorrent } from "@/providers/TorrentProvider"

// type WebTorrentInstance = any
type TorrentInstance = any

export const CreateCinemaHallModal = ({
  handleCloseCreateCinemaHallModal,
  groupId,
}: {
  handleCloseCreateCinemaHallModal: () => void
  groupId: string
}) => {
  // WatchPage.tsx

  // const {
  //   client,
  //   isReady: isClientReady,
  //   handleCreateMovieHall,
  //   handleLeaveMovieHall,
  // } = useTorrent()
  const router = useRouter()
  const [cinemaHallName, setCinemaHallName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const socket = useSocket()
  const inputRef = useRef<HTMLInputElement>(null)

  // const clientRef = useRef<WebTorrentInstance>(null)
  // const torrentRef = useRef<TorrentInstance>(null)
  // const [hashingProgress, setHashingProgress] = useState(0)
  const [magnetURI, setMagnetURI] = useState<string | null>(null)
  const [isHashing, setIsHashing] = useState(false)

  useEffect(() => {
    handleCreateMovieHall()
  }, [])
  // useEffect(() => {
  //   let client: WebTorrentInstance | null = null

  //   // Динамически импортируем библиотеку ТОЛЬКО в браузере
  //   const initClient = async () => {
  //     try {
  //       // const WebTorrent = await import("webtorrent")

  //       const config = {
  //         dht: false,
  //         webSeeds: false,
  //         // tracker: false,
  //       }

  //       const WebTorrentModule =
  //         await import("webtorrent/dist/webtorrent.min.js")

  //       const WebTorrent = WebTorrentModule.default || WebTorrentModule

  //       client = new WebTorrent(config) // Обратите внимание: .default при динамическом импорте
  //       clientRef.current = client
  //     } catch (err) {
  //       console.error("Failed to load WebTorrent:", err)
  //     }
  //   }

  //   initClient()

  //   // Cleanup при размонтировании
  //   return () => {
  //     // if (client) {
  //     //   client.destroy()
  //     // }
  //     if (clientRef.current) {
  //       clientRef.current.destroy()
  //     }
  //     clientRef.current = null
  //     torrentRef.current = null

  //     // torrentRef.current?.destroy()
  //   }
  // }, [])

  const handleFile = async (f: File) => {
    // проверяем что это видео
    if (!f.type.startsWith("video/")) return
    setFile(f)
    // setCinemaFile(f)

    // ✅ Добавьте это в начало:
    setIsHashing(true)
    // setHashingProgress(0) // сброс прогресса для нового файла

    // Ждём клиента если ещё не готов
    let attempts = 0
    while (!client && attempts < 20) {
      await new Promise((r) => setTimeout(r, 100))
      attempts++
    }

    // Проверяем, что клиент уже инициализирован
    if (!client) {
      console.error("WebTorrent client not initialized yet")
      setIsHashing(false)
      return
    }
    if (!isClientReady) {
      console.error("isClientReady isn`t ready")
      setIsHashing(false)
      return
    }

    // if (torrentRef.current) {
    //   torrentRef.current?.destroy()
    //   torrentRef.current = null
    // }

    const torrent = client.seed(
      f,
      {
        announce: [
          "wss://tracker.openwebtorrent.com",
          "wss://tracker.webtorrent.dev",
        ], // без трекеров
      },
      (torrent) => {
        console.log("Magnet:", torrent.magnetURI)
        torrent.on("ready", () => {
          // Файл захэширован, magnet готов!
          setMagnetURI(torrent.magnetURI)
          setIsHashing(false)
        })
      },
    )
    // torrentRef.current = torrent
    console.log("создался торрент в модалке", torrent)
    // torrent.on("ready", () => {
    //   // Файл захэширован, magnet готов!
    //   setMagnetURI(torrent.magnetURI)
    //   setIsHashing(false)
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
    // clearCinemaFile()
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
