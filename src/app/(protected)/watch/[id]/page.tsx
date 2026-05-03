"use client"

import { useSocket } from "@/providers/SocketProvider"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { getCinemaBlobUrl } from "@/store/cinemaFile"
import style from "./WatchPage.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setCinemaHall } from "@/store/slices/cinemaHallSlice"
// import { useSocket } from "@/hooks/useSocket" // твой хук

export default function WatchPage() {
  const { id } = useParams() as { id: string }
  const dispatch = useAppDispatch()

  const socket = useSocket()
  // const [hall, setHall] = useState(null)

  const cinemaHallName = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.cinemaHallName,
  )
  const hallFile = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.file,
  )
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!socket || !id) return
    console.log("На странице до join:", getCinemaBlobUrl()) // null?
    // запрашиваем данные комнаты
    socket.emit("cinema-hall:join", { cinemaHallId: id }, (data) => {
      if (data.error) {
        // нет доступа или комната не найдена
        console.error(data.error)
        return
      }
      dispatch(setCinemaHall(data.hall))
      // setHall(data.hall)

      const url = getCinemaBlobUrl()
      //   console.log("WatchPage url", url)
      if (url) setBlobUrl(url)
    })

    return () => {
      // выходим из комнаты когда уходим со страницы
      socket.emit("cinema-hall:leave", { cinemaHallId: id })
    }
  }, [socket, id])

  if (!cinemaHallName) return <div>Загрузка...</div>

  // файл есть — показываем плеер
  if (blobUrl) {
    return (
      <div className={style.watchPage}>
        <h1>{cinemaHallName}</h1>
        <div className={style.watchPage__containerVideo}>
          <video
            ref={videoRef}
            src={blobUrl}
            controls
            style={{ width: "100%" }}
            onLoadedMetadata={() =>
              setDuration(videoRef.current?.duration || 0)
            }
            onTimeUpdate={() => {
              console.log(
                "videoRef.current?.currentTime",
                videoRef.current?.currentTime,
              )
              setCurrentTime(videoRef.current?.currentTime || 0)
            }}
          />
        </div>
        <button onClick={() => videoRef.current?.play()}>▶</button>
        <button onClick={() => videoRef.current?.pause()}>⏸</button>
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={(e) => {
            const time = Number(e.target.value)
            if (videoRef.current) videoRef.current.currentTime = time
            setCurrentTime(time)
            // videoRef.current.currentTime = Number(e.target.value)
          }}
        />
      </div>
    )
  }

  // файла нет — просим открыть
  return (
    <div>
      <h1>{cinemaHallName}</h1>
      <p>
        Нужен файл: {hallFile.name} (
        {(hallFile.size / 1024 / 1024 / 1024).toFixed(2)} ГБ)
      </p>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => {
          const selectedFile = e.target.files?.[0]
          if (!selectedFile) return
          // проверяем что файл совпадает
          if (
            selectedFile.name !== hallFile.name ||
            selectedFile.size !== hallFile.size
          ) {
            alert("Файл не совпадает! Нужен: " + hallFile.name)
            return
          }
          setBlobUrl(URL.createObjectURL(selectedFile))
        }}
      />
    </div>
  )
}
