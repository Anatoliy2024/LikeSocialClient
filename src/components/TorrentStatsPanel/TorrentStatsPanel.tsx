// components/TorrentStatsPanel/TorrentStatsPanel.tsx
import { useState, useMemo } from "react"
import { useTorrentStats } from "@/hooks/useTorrentStats"
import style from "./TorrentStatsPanel.module.scss"
import { TorrentInstance } from "@/types/webtorrent.types"

interface TorrentStatsPanelProps {
  torrentRef: React.RefObject<TorrentInstance | null> // или импортируй TorrentInstance
  className?: string
  collapsed?: boolean // Сворачиваемая панель
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

const formatSpeed = (bytesPerSec: number) => {
  return formatBytes(bytesPerSec) + "/s"
}

export function TorrentStatsPanel({
  torrentRef,
  className,
  collapsed: initialCollapsed = false,
}: TorrentStatsPanelProps) {
  const { stats } = useTorrentStats(torrentRef)
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  // Локальные стейты для лимитов (в КБ/с для удобства пользователя)

  // Мемоизируем список пиров, чтобы не перерисовывать при каждом тике
  const sortedWires = useMemo(() => {
    return [...stats.wires].sort((a, b) => b.downloadSpeed - a.downloadSpeed)
  }, [stats.wires])

  if (!torrentRef.current) {
    return (
      <div className={`${style.panel} ${className || ""}`}>
        ⏳ Ожидание торрента...
      </div>
    )
  }

  return (
    <div className={`${style.panel} ${className || ""}`}>
      {/* Заголовок с кнопкой сворачивания */}
      <div className={style.header} onClick={() => setCollapsed(!collapsed)}>
        <h4>📊 Статистика торрента</h4>
        <button className={style.toggleBtn}>{collapsed ? "▶" : "▼"}</button>
      </div>

      {!collapsed && (
        <>
          {/* Глобальные метрики */}
          <div className={style.statsGrid}>
            <div className={style.statItem}>
              <span className={style.label}>👥 Пиров</span>
              <span className={style.value}>{stats.numPeers}</span>
            </div>
            <div className={style.statItem}>
              <span className={style.label}>📥 Скачивание</span>
              <span className={style.value}>
                {formatSpeed(stats.downloadSpeed)}
              </span>
            </div>
            <div className={style.statItem}>
              <span className={style.label}>📤 Раздача</span>
              <span className={style.value}>
                {formatSpeed(stats.uploadSpeed)}
              </span>
            </div>
            <div className={style.statItem}>
              <span className={style.label}>📈 Прогресс</span>
              <span className={style.value}>
                {(stats.progress * 100).toFixed(1)}%
              </span>
            </div>
            <div className={style.statItem}>
              <span className={style.label}>💾 Загружено</span>
              <span className={style.value}>
                {formatBytes(stats.downloaded)}
              </span>
            </div>
            <div className={style.statItem}>
              <span className={style.label}>📦 Всего</span>
              <span className={style.value}>{formatBytes(stats.length)}</span>
            </div>
          </div>

          {/* Список пиров */}
          {sortedWires.length > 0 && (
            <div className={style.peersSection}>
              <h5>Подключенные пиры ({sortedWires.length}):</h5>
              <ul className={style.peersList}>
                {sortedWires.map((wire, i) => (
                  <li key={wire.peerId + i} className={style.peerItem}>
                    <div className={style.peerHeader}>
                      <span className={style.peerId} title={wire.peerId}>
                        {wire.peerId.slice(0, 8)}...
                      </span>
                      <span className={style.peerType}>{wire.type}</span>
                    </div>
                    <div className={style.peerStats}>
                      <span>📥 {formatSpeed(wire.downloadSpeed)}</span>
                      <span>📤 {formatSpeed(wire.uploadSpeed)}</span>
                    </div>
                    <div className={style.peerProgress}>
                      <small>Загружено: {formatBytes(wire.downloaded)}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
