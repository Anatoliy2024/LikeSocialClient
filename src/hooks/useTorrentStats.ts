// hooks/useTorrentStats.ts
import { useEffect, useState } from "react"
import { TorrentInstance } from "@/types/webtorrent.types"

export interface WireStats {
  peerId: string
  type: string
  downloaded: number
  uploaded: number
  downloadSpeed: number
  uploadSpeed: number
}

export interface TorrentStats {
  numPeers: number
  downloadSpeed: number
  uploadSpeed: number
  downloaded: number
  uploaded: number
  progress: number
  length: number
  wires: WireStats[]
}

// Безопасный геттер для разных версий WebTorrent
// @ts-ignore
const getVal = (obj, key: string, fallback = 0) => {
  if (!obj) return fallback
  const val = obj[key]
  return typeof val === "function" ? val() : val || fallback
}

export function useTorrentStats(
  torrentRef: React.RefObject<TorrentInstance | null>,
  intervalMs = 1000,
) {
  const [stats, setStats] = useState<TorrentStats>({
    numPeers: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    downloaded: 0,
    uploaded: 0,
    progress: 0,
    length: 0,
    wires: [],
  })

  useEffect(() => {
    // Тик запускается каждый интервал и читает актуальный .current
    const tick = () => {
      const torrent = torrentRef.current
      if (!torrent) return // Пока торрент не назначен — пропускаем тик

      const wires: WireStats[] =
        // @ts-ignore
        torrent.wires?.map((wire) => ({
          peerId: wire.peerId || "unknown",
          type: wire.type || "webrtc",
          downloaded: wire.downloaded || 0,
          uploaded: wire.uploaded || 0,
          downloadSpeed: getVal(wire, "downloadSpeed"),
          uploadSpeed: getVal(wire, "uploadSpeed"),
        })) || []

      setStats({
        numPeers: torrent.numPeers || 0,
        downloadSpeed: getVal(torrent, "downloadSpeed"),
        uploadSpeed: getVal(torrent, "uploadSpeed"),
        downloaded: torrent.downloaded || 0,
        uploaded: torrent.uploaded || 0,
        progress: torrent.progress || 0,
        length: torrent.length || 0,
        wires,
      })
    }

    // Первый тик сразу + интервал
    tick()
    const interval = setInterval(tick, intervalMs)

    return () => clearInterval(interval)
  }, [torrentRef, intervalMs]) // Запускается один раз при маунте

  return { stats }
}

// // hooks/useTorrentStats.ts
// import { useEffect, useState, useRef } from "react"
// import { TorrentInstance } from "@/types/webtorrent.types"

// export interface WireStats {
//   peerId: string
//   type: string
//   downloaded: number
//   uploaded: number
//   downloadSpeed: number
//   uploadSpeed: number
// }

// export interface TorrentStats {
//   numPeers: number
//   downloadSpeed: number
//   uploadSpeed: number
//   downloaded: number
//   uploaded: number
//   progress: number
//   length: number
//   wires: WireStats[]
// }

// export function useTorrentStats(
//   torrentRef: React.RefObject<TorrentInstance | null>,
//   intervalMs = 1000, // Частота обновления
// ) {
//   const [stats, setStats] = useState<TorrentStats>({
//     numPeers: 0,
//     downloadSpeed: 0,
//     uploadSpeed: 0,
//     downloaded: 0,
//     uploaded: 0,
//     progress: 0,
//     length: 0,
//     wires: [],
//   })

//   useEffect(() => {
//     const torrent = torrentRef.current
//     if (!torrent) return

//     const updateStats = () => {
//       const wires = torrent.wires.map((wire: any) => ({
//         peerId: wire.peerId,
//         type: wire.type,
//         downloaded: wire.downloaded,
//         uploaded: wire.uploaded,
//         downloadSpeed:
//           typeof wire.downloadSpeed === "function" ? wire.downloadSpeed() : 0,
//         uploadSpeed:
//           typeof wire.uploadSpeed === "function" ? wire.uploadSpeed() : 0,
//       }))

//       setStats({
//         numPeers: torrent.numPeers,
//         downloadSpeed: torrent.downloadSpeed,
//         uploadSpeed: torrent.uploadSpeed,
//         downloaded: torrent.downloaded,
//         uploaded: torrent.uploaded,
//         progress: torrent.progress,
//         length: torrent.length,
//         wires,
//       })
//     }

//     // Сразу обновляем + интервал
//     updateStats()
//     const interval = setInterval(updateStats, intervalMs)

//     return () => clearInterval(interval)
//   }, [torrentRef, intervalMs])

//   // 👇 Экспортируем утилиты для управления
//   const throttleDownload = (bytesPerSec: number) => {
//     torrentRef.current?.throttleDownload?.(bytesPerSec)
//   }

//   const throttleUpload = (bytesPerSec: number) => {
//     torrentRef.current?.throttleUpload?.(bytesPerSec)
//   }

//   return { stats, throttleDownload, throttleUpload }
// }
