import { WebTorrentInstance } from "@/types/webtorrent.types"

export function waitForClient(
  clientRef: React.RefObject<WebTorrentInstance | null>,
  signal?: AbortSignal,
  timeoutMs = 10000,
): Promise<WebTorrentInstance> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error("Aborted"))
    if (clientRef.current) return resolve(clientRef.current)
    const start = Date.now()
    const interval = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(interval)
        return reject(new Error("Aborted"))
      }
      if (clientRef.current) {
        clearInterval(interval)
        resolve(clientRef.current)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval)
        reject(new Error("Timeout"))
      }
    }, 100)
  })
}
