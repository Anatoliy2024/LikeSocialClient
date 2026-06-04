import { TorrentStatus } from "@/types/webtorrent.types"
import style from "./TorrentStatusBar.module.scss"

interface Props {
  status: TorrentStatus
  bufferProgress: number
  failedTrackers: string[] // массив вместо одного
  totalTrackers: number
}

export function TorrentStatusBar({
  status,
  bufferProgress,
  failedTrackers,
  totalTrackers,
}: Props) {
  const config = getConfig(
    status,
    // bufferProgress,
    failedTrackers,
    totalTrackers,
  )
  if (!config) return null

  return (
    <div className={`${style.torrentStatusBar} ${style[config.variant]}`}>
      <div
        className={`${style.torrentStatusBar__dot} ${style[`dot_${config.variant}`]}`}
      />
      <span className={style.text}>{config.text}</span>
      {config.sub && <span className={style.sub}>{config.sub}</span>}
      {status === "buffering" && (
        <div className={style.torrentStatusBar__progress}>
          <div
            className={style.torrentStatusBar__progressFill}
            style={{ width: `${bufferProgress}%` }}
          />
        </div>
      )}
      {status === "buffering" && (
        <span className={style.pct}>{bufferProgress}%</span>
      )}
    </div>
  )
}

function getConfig(
  stage: TorrentStatus,
  // progress: number,
  failedTrackers: string[],
  totalTrackers: number,
) {
  const failedCount = failedTrackers.length
  const workingCount = totalTrackers - failedCount

  switch (stage) {
    case "idle":
      return { variant: "neutral", text: "Ожидание", sub: "инициализация..." }
    case "tracker_connecting":
      return {
        variant: "info",
        text: "Подключение к трекерам",
        sub: `Проверяем ${totalTrackers} трекеров...`,
      }
    case "tracker_partial":
      return {
        variant: "warn",
        text: "Проблемы с трекерами",
        sub: `${failedCount}/${totalTrackers} недоступно, пробуем остальные...`,
      }
    case "tracker_failed":
      return {
        variant: "err",
        text: "Все трекеры недоступны",
        sub: `${totalTrackers}/${totalTrackers} серверов не отвечают`,
      }
    case "error":
      return {
        variant: "err",
        text: "Неизвестная ошибка",
        sub: "Попробуйте позже",
      }
    case "peer_search":
      return {
        variant: "info",
        text: "Поиск пиров",
        sub: `${workingCount} трекеров работает`,
      }
    case "peer_timeout":
      return {
        variant: "warn",
        text: "Поиск пиров",
        sub: "больше 30 с — пиров нет",
      }
    case "buffering":
      return { variant: "info", text: "Загрузка", sub: null }
    case "done":
      return { variant: "ok", text: "Файл загружен", sub: null }
    default:
      return null
  }
}
