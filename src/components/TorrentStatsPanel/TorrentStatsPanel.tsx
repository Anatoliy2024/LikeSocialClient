import { useState, useMemo } from "react"
import { useTorrentStats } from "@/hooks/useCinemaHallPage/useTorrentStats"
import style from "./TorrentStatsPanel.module.scss"
import { TorrentInstance } from "@/types/webtorrent.types"
import { useAppSelector } from "@/store/hooks"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"

interface TorrentStatsPanelProps {
  torrentRef: React.RefObject<TorrentInstance | null>
  className?: string
  collapsed?: boolean
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"] as const
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const formatSpeed = (bytesPerSec: number): string => {
  return `${formatBytes(bytesPerSec)}/s`
}

export function TorrentStatsPanel({
  torrentRef,
  className,
  collapsed: initialCollapsed = false,
}: TorrentStatsPanelProps) {
  const { stats } = useTorrentStats(torrentRef)
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  const participants = useAppSelector(
    (state) => state.cinemaHall.cinemaHallTarget.participants,
  )

  // useMemo теперь реально работает — stats.wires меняется только при реальных изменениях
  const sortedWires = useMemo(() => {
    return [...stats.wires].sort((a, b) => b.downloadSpeed - a.downloadSpeed)
  }, [stats.wires])
  // console.log("sortedWires", sortedWires)
  if (!torrentRef.current) {
    return (
      <div className={`${style.torrentStatsPanel} ${className ?? ""}`}>
        ⏳ Ожидание торрента...
      </div>
    )
  }

  return (
    <div className={`${style.torrentStatsPanel} ${className ?? ""}`}>
      <div
        className={style.torrentStatsPanel__header}
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <h4>📊 Статистика торрента</h4>
        <button className={style.torrentStatsPanel__toggleBtn}>
          {collapsed ? "▶" : "▼"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className={style.torrentStatsPanel__statsGrid}>
            <div className={style.torrentStatsPanel__statItem}>
              <span className={style.torrentStatsPanel__label}>👥 Пиров</span>
              <span className={style.torrentStatsPanel__value}>
                {stats.numPeers}
              </span>
            </div>
            <div className={style.torrentStatsPanel__statItem}>
              <span className={style.torrentStatsPanel__label}>
                📥 Скачивание
              </span>
              <span className={style.torrentStatsPanel__value}>
                {formatSpeed(stats.downloadSpeed)}
              </span>
            </div>
            <div className={style.torrentStatsPanel__statItem}>
              <span className={style.torrentStatsPanel__label}>📤 Раздача</span>
              <span className={style.torrentStatsPanel__value}>
                {formatSpeed(stats.uploadSpeed)}
              </span>
            </div>
            <div className={style.torrentStatsPanel__statItem}>
              <span className={style.torrentStatsPanel__label}>
                📈 Прогресс
              </span>
              <span className={style.torrentStatsPanel__value}>
                {(stats.progress * 100).toFixed(1)}%
              </span>
            </div>
            <div className={style.torrentStatsPanel__statItem}>
              <span className={style.torrentStatsPanel__label}>
                💾 Загружено
              </span>
              <span className={style.torrentStatsPanel__value}>
                {formatBytes(stats.downloaded)}
              </span>
            </div>
            <div className={style.torrentStatsPanel__statItem}>
              <span className={style.torrentStatsPanel__label}>📦 Всего</span>
              <span className={style.torrentStatsPanel__value}>
                {formatBytes(stats.length)}
              </span>
            </div>
          </div>

          {sortedWires.length > 0 && (
            <div className={style.torrentStatsPanel__peersSection}>
              <h5>Подключенные пиры ({sortedWires.length}):</h5>
              <ul className={style.torrentStatsPanel__peersList}>
                {sortedWires.map((wire, i) => {
                  const participant = participants.find(
                    (user) => user.peerId === wire.peerId,
                  )
                  // console.log("participants", participants)
                  return (
                    <li key={i} className={style.torrentStatsPanel__peerItem}>
                      <div className={style.torrentStatsPanel__peerHeader}>
                        <div className={style.torrentStatsPanel__userInfo}>
                          {participants.length > 0 && (
                            <div
                              className={style.torrentStatsPanel__imgContainer}
                            >
                              <CloudinaryImage
                                src={
                                  participant?.avatar ?? "/images/anonym.jpeg"
                                }
                                alt="avatar"
                                width={70}
                                height={70}
                              />
                            </div>
                          )}
                          {participants.length > 0 && (
                            <div>{participant?.username}</div>
                          )}
                        </div>
                        <span className={style.torrentStatsPanel__peerType}>
                          {wire.type}
                        </span>
                      </div>
                      <div className={style.torrentStatsPanel__peerStats}>
                        <span>📥 {formatSpeed(wire.downloadSpeed)}</span>
                        <span>📤 {formatSpeed(wire.uploadSpeed)}</span>
                      </div>
                      <div className={style.torrentStatsPanel__peerProgress}>
                        <small>Загружено: {formatBytes(wire.downloaded)}</small>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
