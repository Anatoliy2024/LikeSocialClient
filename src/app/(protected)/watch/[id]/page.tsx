"use client"

import { useParams } from "next/navigation"
import style from "./WatchPage.module.scss"
import ButtonMenu from "@/components/ui/button/Button"
import Spinner from "@/components/ui/spinner/Spinner"
import { TorrentStatsPanel } from "@/components/TorrentStatsPanel/TorrentStatsPanel"
import { VideoAndChatContainer } from "@/components/VideoAndChatContainer/VideoAndChatContainer"
import { CloudinaryImage } from "@/components/CloudinaryImage/CloudinaryImage"
import { calculateSeedingDelay } from "@/utils/calculateSeedingDelay"
import { UserIcon } from "@/assets/icons/userIcon"
import { UserWaiting } from "@/assets/icons/userWaiting"
import { useCinemaHallPage } from "@/hooks/useCinemaHallPage/useCinemaHallPage"
import { TorrentStatusBar } from "@/components/TorrentStatusBar/TorrentStatusBar"

export default function WatchPage() {
  const { id } = useParams() as { id: string }
  const {
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
  } = useCinemaHallPage(id)

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
        <TorrentStatusBar
          status={torrentStatus}
          bufferProgress={bufferProgress}
          failedTracker={failedTracker}
        />
        {/* {torrentStatus === "ready" && <div>Файл готов к скачке...</div>} */}
        {/* {torrentStatus === "connecting" && <p>🔍 Поиск пиров...</p>} */}
        {/* {bufferingStatus && bufferProgress !== 100 ? (
          <p>⏳ Видео загружено на {bufferProgress}%</p>
        ) : (
          <p>Загрузка завершилась</p>
        )} */}
        {/* {torrentStatus === "error" && <p>❌ Ошибка подключения.</p>} */}

        <TorrentStatsPanel
          torrentRef={torrentRef}
          className={style.statsPanel}
          collapsed={true} // По умолчанию свёрнута
        />
      </div>
    </>
  )
}
