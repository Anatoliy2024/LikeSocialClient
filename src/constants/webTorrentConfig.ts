export const TRACKERS: string[] = [
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.webtorrent.dev",
]
export const WEBTORRENT_CONFIG = {
  dht: false,
  tracker: {
    announce: TRACKERS, // ← ДОБАВИТЬ ЭТУ СТРОКУ
    rtcConfig: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
      ],
    },
  },
} as const

export const VIDEO_EXTENSIONS = [".mp4", ".mkv", ".webm"] as const
