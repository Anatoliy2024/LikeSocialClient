import { RefObject, useEffect } from "react"
import { initWebTorrentWithSW } from "@/lib/webtorrent-sw"
import { TorrentInstance, WebTorrentInstance } from "@/types/webtorrent.types"
import { ICE_SERVERS } from "@/constants/webTorrentConfig"
// import { useTrackers } from './useTrackers'
// import { WEBTORRENT_CONFIG } from "@/constants/webTorrentConfig"

export const useInitCinemaHall = (
  clientRef: RefObject<WebTorrentInstance | null>,
  torrentRef: RefObject<TorrentInstance | null>,
  // peerCheckRef: RefObject<ReturnType<typeof setInterval> | null>,
  abortControllerRef: RefObject<AbortController | null>,
  torrentInfoHashRef: RefObject<string | null>,
  blobUrlRef: RefObject<string | null>,
  trackers: string[],
) => {
  useEffect(() => {
    let cancelled = false
    let cleanupStarted = false

    // ─────────────────────────────────────
    // 🔹 ФУНКЦИЯ ОЧИСТКИ (в одном месте!)
    // ─────────────────────────────────────
    const cleanup = async () => {
      if (cleanupStarted) return
      cleanupStarted = true

      console.log("🧹 Начинаем очистку CinemaHall...")

      try {
        // // 1. Останавливаем периодические проверки
        // if (peerCheckRef.current) {
        //   clearInterval(peerCheckRef.current)
        //   peerCheckRef.current = null
        // }

        // 2. Отменяем все отложенные операции
        abortControllerRef.current?.abort()

        // 3. Освобождаем Blob URL (синхронно)
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current)
          blobUrlRef.current = null
        }

        // 4. Удаляем торрент-файлы (асинхронно, но fire-and-forget)
        const hash = torrentInfoHashRef.current
        if (hash) {
          // Не ждем завершения, чтобы не блокировать размонтирование
          deleteTorrentFiles(hash.slice(0, 8)).catch((err) =>
            console.error("❌ Ошибка при удалении файлов:", err),
          )
        }

        // 5. Очищаем слушатели торрента (перед уничтожением клиента)
        const torrent = torrentRef.current
        if (torrent) {
          torrent.removeAllListeners()
          // Если торрент имеет свой метод destroy — вызываем его
          // torrent.destroy?.()
          torrentRef.current = null
        }

        // 6. Уничтожаем клиент (последним, т.к. он управляет остальным)
        if (clientRef.current) {
          clientRef.current.destroy()
          clientRef.current = null
        }

        // 7. Сбрасываем хэш
        torrentInfoHashRef.current = null

        console.log("✅ Очистка завершена")
      } catch (error) {
        console.error("💥 Ошибка при очистке:", error)
      }
    }

    // ─────────────────────────────────────
    // 🔹 ИНИЦИАЛИЗАЦИЯ
    // ─────────────────────────────────────
    const initClient = async () => {
      try {
        const WebTorrentModule =
          await import("webtorrent/dist/webtorrent.min.js")
        const WebTorrent = WebTorrentModule.default || WebTorrentModule

        const WEBTORRENT_CONFIG = {
          dht: false,
          tracker: {
            announce: trackers, // ← ДОБАВИТЬ ЭТУ СТРОКУ
            rtcConfig: {
              iceServers: ICE_SERVERS,
            },
          },
        } as const

        const client = new WebTorrent(WEBTORRENT_CONFIG)

        // 🔥 Проверка отмены ПОСЛЕ каждой асинхронной операции
        if (cancelled) {
          await cleanup()
          return
        }

        clientRef.current = client

        await initWebTorrentWithSW(client).then((swOk) => {
          if (swOk) console.log("✅ SW готов")
          else console.warn("⚠️ SW не инициализирован")
        })

        if (cancelled) {
          await cleanup()
          return
        }

        console.log("✅ WebTorrent клиент готов")
      } catch (err) {
        console.error("Failed to load WebTorrent:", err)
        // Попытка почистить частичную инициализацию
        cleanup()
      }
    }

    initClient()

    // ─────────────────────────────────────
    // 🔹 RETURN CLEANUP (вызывается при размонтировании)
    // ─────────────────────────────────────
    return () => {
      cancelled = true
      cleanup()
    }
  }, []) // ← Пустой массив ОК, т.к. все рефы стабильны

  // Вспомогательная функция (можно вынести за пределы хука)
  async function deleteTorrentFiles(hash: string): Promise<void> {
    try {
      const root = await navigator.storage.getDirectory()
      const shortHash = hash.slice(0, 8)
      // @ts-ignore
      for await (const name of root.keys()) {
        if ((name as string).endsWith(shortHash)) {
          try {
            await root.removeEntry(name, { recursive: true })
            console.log(`✅ Удалено: ${name}`)
          } catch (e) {
            if (
              e instanceof DOMException &&
              e.name === "NoModificationAllowedError"
            )
              return
            throw e
          }
          return
        }
      }
      console.warn(`⚠️ Папка с hash ${shortHash} не найдена`)
    } catch (e) {
      console.error("❌ Ошибка удаления:", e)
    }
  }
}

// import { RefObject, useEffect } from "react"
// import { initWebTorrentWithSW } from "@/lib/webtorrent-sw"
// import { TorrentInstance, WebTorrentInstance } from "@/types/webtorrent.types"
// import { WEBTORRENT_CONFIG } from "@/constants/webTorrentConfig"

// export const useInitCinemaHall = (
//   clientRef: RefObject<WebTorrentInstance | null>,
//   torrentRef: RefObject<TorrentInstance | null>,
//   peerCheckRef: RefObject<ReturnType<typeof setInterval> | null>,
//   abortControllerRef: RefObject<AbortController | null>,
//   torrentInfoHashRef: RefObject<string | null>,
//   blobUrlRef: RefObject<string | null>,
// ) => {
//   useEffect(() => {
//     let cancelled = false
//     const initClient = async () => {
//       try {
//         const WebTorrentModule =
//           await import("webtorrent/dist/webtorrent.min.js")
//         const WebTorrent = WebTorrentModule.default || WebTorrentModule

//         const client = new WebTorrent(WEBTORRENT_CONFIG)

//         if (cancelled) {
//           client.destroy()
//           return
//         }

//         clientRef.current = client

//         await initWebTorrentWithSW(client).then((swOk) => {
//           if (swOk) console.log("✅ SW готов")
//           else console.warn("⚠️ SW не инициализирован")
//         })

//         console.log("✅ WebTorrent клиент готов")
//       } catch (err) {
//         console.error("Failed to load WebTorrent:", err)
//       }
//     }

//     initClient()

//     return () => {
//       cancelled = true
//       if (clientRef.current) {
//         clientRef.current.destroy()
//         clientRef.current = null
//       }
//       torrentRef.current = null
//     }
//   }, []) // ← ПУСТОЙ массив! Только один раз

//   //отчистка
//   useEffect(() => {
//     return () => {
//       if (peerCheckRef.current) {
//         clearInterval(peerCheckRef.current)
//       }

//       abortControllerRef.current?.abort()

//       const torrent = torrentRef.current
//       if (torrent) {
//         torrent.removeAllListeners() // WebTorrent API
//         // или по-отдельности: torrent.off('download', onDownload)
//       }
//     }
//   }, [])

//   useEffect(() => {
//     async function deleteTorrentFiles(hash: string): Promise<void> {
//       try {
//         const root = await navigator.storage.getDirectory()
//         const shortHash = hash.slice(0, 8)

//         // Ищем папку которая заканчивается на наш hash
//         // @ts-ignore
//         for await (const name of root.keys()) {
//           if ((name as string).endsWith(shortHash)) {
//             try {
//               await root.removeEntry(name, { recursive: true })
//               console.log(`✅ Удалено: ${name}`)
//             } catch (e) {
//               // NoModificationAllowedError — файл уже удалён WebTorrent'ом, игнорируем
//               if (
//                 e instanceof DOMException &&
//                 e.name === "NoModificationAllowedError"
//               )
//                 return
//               throw e
//             }

//             // await root.removeEntry(name, { recursive: true })
//             // console.log(`✅ Удалено: ${name}`)
//             return
//           }
//         }

//         console.warn(`⚠️ Папка с hash ${shortHash} не найдена`)
//       } catch (e) {
//         console.error("❌ Ошибка удаления:", e)
//       }
//     }

//     return () => {
//       const hash = torrentInfoHashRef.current
//       console.log("hash", hash)
//       if (!hash) return

//       const shortHash = hash.slice(0, 8)
//       deleteTorrentFiles(shortHash)
//     }
//   }, []) // пустой массив — только при размонтировании

//   useEffect(() => {
//     return () => {
//       if (blobUrlRef.current) {
//         URL.revokeObjectURL(blobUrlRef.current)
//       }
//     }
//   }, [])
// }
