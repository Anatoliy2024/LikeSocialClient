// lib/webtorrent-sw.ts

export interface WebTorrentClient {
  createServer(opts: { controller: ServiceWorkerRegistration }): void
  // Добавь другие методы, которые используешь в проекте
}

export async function initWebTorrentWithSW(
  client: WebTorrentClient,
): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false

  try {
    await navigator.serviceWorker.register("/sw.min.js")
    const controller = await navigator.serviceWorker.ready
    // Передаём контроллер клиенту
    client.createServer({ controller })
    return true
  } catch (e) {
    console.error("SW error:", e)
    return false
  }
}

// // src/lib/webtorrent-sw.ts
// // import type WebTorrent from 'webtorrent'
// type WebTorrent = any

// export const initWebTorrentWithSW = async (
//   client: WebTorrent,
// ): Promise<boolean> => {
//   // Проверка: мы в браузере?
//   if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
//     console.warn("⚠️ Service Worker не поддерживается")
//     return false
//   }

//   try {
//     // 1. Регистрируем воркер (путь от корня домена!)
//     const registration = await navigator.serviceWorker.register("/sw.min.js", {
//       scope: "/", // 🔥 Важно: корневой скоуп, чтобы перехватывать /webtorrent/*
//     })

//     // 2. Получаем воркер (активный, ожидающий или устанавливающий)
//     const worker =
//       registration.active || registration.waiting || registration.installing
//     if (!worker) {
//       throw new Error("Service Worker не найден после регистрации")
//     }

//     // 3. Функция проверки состояния и создания сервера
//     const tryCreateServer = (w: ServiceWorker): boolean => {
//       if (w.state === "activated") {
//         // 🔥 Передаём registration, а не controller!
//         client.createServer({ controller: registration })
//         console.log("✅ WebTorrent + Service Worker инициализирован")
//         return true
//       }
//       return false
//     }

//     // 4. Если воркер уже активен — создаём сервер сразу
//     if (tryCreateServer(worker)) {
//       return true
//     }

//     // 5. Если нет — ждём события активации
//     await new Promise<void>((resolve, reject) => {
//       const timeout = setTimeout(() => {
//         worker.removeEventListener("statechange", onStateChange)
//         reject(new Error("Service Worker не активировался за 10 секунд"))
//       }, 10000)

//       const onStateChange = (event: Event) => {
//         const target = event.target as ServiceWorker
//         if (target.state === "activated") {
//           clearTimeout(timeout)
//           worker.removeEventListener("statechange", onStateChange)
//           tryCreateServer(worker)
//           resolve()
//         } else if (target.state === "redundant") {
//           clearTimeout(timeout)
//           reject(new Error("Service Worker стал redundant"))
//         }
//       }

//       worker.addEventListener("statechange", onStateChange)
//     })

//     return true
//   } catch (err) {
//     console.error("❌ Ошибка инициализации Service Worker:", err)
//     return false
//   }
// }
