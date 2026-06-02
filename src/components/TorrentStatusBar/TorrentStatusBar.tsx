import { TorrentStatus } from "@/types/webtorrent.types"
import style from "./TorrentStatusBar.module.scss"

interface Props {
  status: TorrentStatus
  bufferProgress: number
  failedTracker?: string
}

export function TorrentStatusBar({
  status,
  bufferProgress,
  failedTracker,
}: Props) {
  const config = getConfig(status, bufferProgress, failedTracker)
  if (!config) return null

  return (
    <div className={`${style.bar} ${style[config.variant]}`}>
      <div className={`${style.dot} ${style[`dot_${config.variant}`]}`} />
      <span className={style.text}>{config.text}</span>
      {config.sub && <span className={style.sub}>{config.sub}</span>}
      {status === "buffering" && (
        <div className={style.progress}>
          <div
            className={style.progressFill}
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
  progress: number,
  failedTracker?: string,
) {
  switch (stage) {
    case "idle":
      return { variant: "neutral", text: "Ожидание", sub: "инициализация..." }
    case "tracker_connecting":
      return {
        variant: "info",
        text: "Подключение к трекерам",
        sub: "openwebtorrent.com, webtorrent.dev",
      }
    case "tracker_partial":
      return {
        variant: "info",
        text: "Подключение к трекерам",
        sub: `${failedTracker} недоступен, пробуем второй...`,
      }
    case "tracker_failed":
      return {
        variant: "err",
        text: "Трекеры недоступны",
        sub: "оба сервера не отвечают",
      }
    case "error":
      return {
        variant: "err",
        text: "Неизвестная ошибка",
        sub: "Попробуйте позже",
      }
    case "peer_search":
      return { variant: "info", text: "Поиск пиров", sub: "трекеры подключены" }
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
