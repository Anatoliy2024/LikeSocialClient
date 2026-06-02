// types/webtorrent.types.ts
import type WebTorrent from "webtorrent"

// Берём типы напрямую из библиотеки
export type WebTorrentInstance = WebTorrent.Instance & {
  peerId?: string
}
// export type TorrentInstance = WebTorrent.Torrent
// export type TorrentFile = WebTorrent.TorrentFile

export interface TorrentFile extends WebTorrent.TorrentFile {
  streamTo?: (video: HTMLVideoElement) => void
  getBlobURL: (
    cb: (err: Error | string | undefined, url?: string) => void,
  ) => void
}
// Расширяем Torrent недостающими событиями
export interface TorrentInstance extends WebTorrent.Torrent {
  files: TorrentFile[]
}

export interface IceServer {
  urls: string
  username?: string
  credential?: string
}

export interface RtcConfig {
  iceServers: IceServer[]
}

export interface TrackerConfig {
  rtcConfig: RtcConfig
}

export interface WebTorrentConfig {
  dht?: boolean
  tracker?: TrackerConfig | boolean
  webSeeds?: boolean
}

// export type TorrentStatus = "idle" | "connecting" | "ready" | "error"

export type TorrentStatus =
  | "idle"
  | "tracker_connecting" // пытаемся подключиться
  | "tracker_partial" // один трекер упал, второй ещё живой
  | "tracker_failed" // оба упали
  | "error"
  | "peer_search" // трекеры ок, ищем пиров
  | "peer_timeout" // > 30с, пиров нет
  | "buffering" // есть пиры, скачиваем
  | "done" // всё скачано

export interface AddTorrentOptions {
  announce?: string[]
  store?: unknown
  path?: string
  destroyStoreOnDestroy?: boolean
}

export interface SeedTorrentOptions {
  announce?: string[]
  name?: string
  comment?: string
  createdBy?: string
  pieceLength?: number
}
