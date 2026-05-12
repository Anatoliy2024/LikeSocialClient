import { useState, useRef, DragEvent, ChangeEvent } from "react"
import style from "./CreateCinemaHallModal.module.scss"
import ButtonMenu from "../ui/button/Button"
import { useSocket } from "@/providers/SocketProvider"
import {
  clearCinemaFile,
  getCinemaBlobUrl,
  setCinemaFile,
} from "@/store/cinemaFile"
import { useRouter } from "next/navigation"

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

  const handleFile = (f: File) => {
    // проверяем что это видео
    if (!f.type.startsWith("video/")) return
    setFile(f)
    setCinemaFile(f)
    console.log("После setFile:", getCinemaBlobUrl())
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

        {/* скрытый input */}
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          style={{ display: "none" }}
          onChange={handleInputChange}
        />
        <div className={style.createCinemaHallModal__buttonContainer}>
          <ButtonMenu disabled={!file} onClick={createHandle}>
            Создать Кинозал
          </ButtonMenu>
          <ButtonMenu onClick={handleCloseModal}>Отмена</ButtonMenu>
        </div>
      </div>
    </div>
  )
}
// import style from "./CreateCinemaHallModal.module.scss"
// export const CreateCinemaHallModal = ({
//   handleCloseCreateCinemaHallModal,
// }: {
//   handleCloseCreateCinemaHallModal: () => void
// }) => {
//   return (
//     <div
//       className={style.createCinemaHallModal}
//       onClick={handleCloseCreateCinemaHallModal}
//     >
//       <div
//         className={style.createCinemaHallModal__container}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <h3>CreateCinemaHallModal</h3>
//         <div>
//           <label htmlFor="movie-name">Название фильма</label>{" "}
//           <input type="text" id="movie-name" />
//         </div>
//         <input type="file" />
//         <button>Создать Кинозал</button>
//       </div>
//     </div>
//   )
// }
