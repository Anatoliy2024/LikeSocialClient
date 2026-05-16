// lib/webtorrent-sw.ts

export interface WebTorrentClient {
  createServer(opts: { controller: ServiceWorkerRegistration }): void
  // Добавь другие методы, которые используешь в проекте
}

// export async function initWebTorrentWithSW(
//   client: WebTorrentClient,
// ): Promise<boolean> {
//   if (!("serviceWorker" in navigator)) return false

//   try {
//     await navigator.serviceWorker.register("/sw.min.js")
//     const controller = await navigator.serviceWorker.ready
//     // Передаём контроллер клиенту
//     client.createServer({ controller })
//     return true
//   } catch (e) {
//     console.error("SW error:", e)
//     return false
//   }
// }
export async function initWebTorrentWithSW(
  client: WebTorrentClient,
): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false

  try {
    // Теперь регистрируем единый SW вместо sw.min.js
    // await navigator.serviceWorker.register("/service-worker.js")
    const reg = await navigator.serviceWorker.ready

    // const controller = await navigator.serviceWorker.ready
    client.createServer({ controller: reg })
    return true
  } catch (e) {
    console.error("SW error:", e)
    return false
  }
}

// Удаление торрента
export async function deleteTorrentFiles(hash: string): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  const channel = new MessageChannel()

  channel.port1.onmessage = ({ data }) => {
    console.log(data.success ? "✅ Удалено" : "❌ Ошибка:", data.error)
  }

  reg.active?.postMessage({ type: "DELETE_TORRENT", hash }, [channel.port2])
}
