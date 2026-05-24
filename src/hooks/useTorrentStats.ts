import { useEffect, useState, useRef, useCallback } from "react"
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

const INITIAL_STATS: TorrentStats = {
  numPeers: 0,
  downloadSpeed: 0,
  uploadSpeed: 0,
  downloaded: 0,
  uploaded: 0,
  progress: 0,
  length: 0,
  wires: [],
}

// Безопасный геттер + округление убирает флуктуации float (0.000001 вместо 0)
const getVal = (
  obj: Record<string, unknown> | null,
  key: string,
  fallback = 0,
): number => {
  if (!obj) return fallback
  const val = obj[key]
  const raw =
    typeof val === "function"
      ? (val as () => number)()
      : ((val as number) ?? fallback)
  return Math.round(raw)
}

const wiresAreEqual = (prev: WireStats[], next: WireStats[]): boolean => {
  if (prev.length !== next.length) return false
  return next.every((w, i) => {
    const p = prev[i]
    // downloaded растёт дискретно — достаточно сравнивать его + peerId
    return p.peerId === w.peerId && p.downloaded === w.downloaded
  })
}

const statsAreEqual = (prev: TorrentStats, next: TorrentStats): boolean => {
  return (
    prev.numPeers === next.numPeers &&
    prev.downloadSpeed === next.downloadSpeed &&
    prev.uploadSpeed === next.uploadSpeed &&
    prev.downloaded === next.downloaded &&
    prev.uploaded === next.uploaded &&
    prev.progress === next.progress &&
    prev.length === next.length &&
    wiresAreEqual(prev.wires, next.wires)
  )
}

export function useTorrentStats(
  torrentRef: React.RefObject<TorrentInstance | null>,
  intervalMs = 1000,
) {
  const [stats, setStats] = useState<TorrentStats>(INITIAL_STATS)
  const prevStatsRef = useRef<TorrentStats>(INITIAL_STATS)

  const tick = useCallback(() => {
    const torrent = torrentRef.current
    if (!torrent) return

    const torrentObj = torrent as unknown as Record<string, unknown>

    const wires: WireStats[] =
      // @ts-ignore
      (torrent.wires as Array<Record<string, unknown>> | undefined)?.map(
        (wire) => ({
          peerId: (wire.peerId as string) || "unknown",
          type: (wire.type as string) || "webrtc",
          downloaded: (wire.downloaded as number) || 0,
          uploaded: (wire.uploaded as number) || 0,
          downloadSpeed: getVal(wire, "downloadSpeed"),
          uploadSpeed: getVal(wire, "uploadSpeed"),
        }),
      ) ?? []

    const next: TorrentStats = {
      numPeers: (torrent.numPeers as number) || 0,
      downloadSpeed: getVal(torrentObj, "downloadSpeed"),
      uploadSpeed: getVal(torrentObj, "uploadSpeed"),
      downloaded: (torrent.downloaded as number) || 0,
      uploaded: (torrent.uploaded as number) || 0,
      progress: torrent.progress || 0,
      length: torrent.length || 0,
      wires,
    }

    if (!statsAreEqual(prevStatsRef.current, next)) {
      prevStatsRef.current = next
      setStats(next)
    }
  }, [torrentRef])

  useEffect(() => {
    tick()
    const interval = setInterval(tick, intervalMs)
    return () => clearInterval(interval)
  }, [tick, intervalMs])

  return { stats }
}

// // hooks/useTorrentStats.ts
// import { useEffect, useState } from "react"
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

// // Безопасный геттер для разных версий WebTorrent
// // @ts-ignore
// const getVal = (obj, key: string, fallback = 0) => {
//   if (!obj) return fallback
//   const val = obj[key]
//   return typeof val === "function" ? val() : val || fallback
// }

// export function useTorrentStats(
//   torrentRef: React.RefObject<TorrentInstance | null>,
//   intervalMs = 1000,
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
//     // Тик запускается каждый интервал и читает актуальный .current
//     const tick = () => {
//       const torrent = torrentRef.current
//       if (!torrent) return // Пока торрент не назначен — пропускаем тик

//       const wires: WireStats[] =
//         // @ts-ignore
//         torrent.wires?.map((wire) => ({
//           peerId: wire.peerId || "unknown",
//           type: wire.type || "webrtc",
//           downloaded: wire.downloaded || 0,
//           uploaded: wire.uploaded || 0,
//           downloadSpeed: getVal(wire, "downloadSpeed"),
//           uploadSpeed: getVal(wire, "uploadSpeed"),
//         })) || []

//       setStats({
//         numPeers: torrent.numPeers || 0,
//         downloadSpeed: getVal(torrent, "downloadSpeed"),
//         uploadSpeed: getVal(torrent, "uploadSpeed"),
//         downloaded: torrent.downloaded || 0,
//         uploaded: torrent.uploaded || 0,
//         progress: torrent.progress || 0,
//         length: torrent.length || 0,
//         wires,
//       })
//     }

//     // Первый тик сразу + интервал
//     tick()
//     const interval = setInterval(tick, intervalMs)

//     return () => clearInterval(interval)
//   }, [torrentRef, intervalMs]) // Запускается один раз при маунте

//   return { stats }
// }
