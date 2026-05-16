// public/service-worker.js

// ============================================
// 🔹 WEBTORRENT СТРИМИНГ
// ============================================
let cancelled = false

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", () => {
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { url } = event.request
  const scope = self.registration.scope

  if (!url.includes(scope + "webtorrent/")) return

  if (url.includes(scope + "webtorrent/keepalive/")) {
    event.respondWith(new Response())
    return
  }

  if (url.includes(scope + "webtorrent/cancel/")) {
    event.respondWith(
      new Response(
        new ReadableStream({
          cancel() {
            cancelled = true
          },
        }),
      ),
    )
    return
  }

  // Основной стриминг
  event.respondWith(
    (async () => {
      const { url: reqUrl, method, headers, destination } = event.request
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      })

      const [response, port] = await new Promise((resolve) => {
        for (const client of allClients) {
          const channel = new MessageChannel()
          channel.port1.onmessage = ({ data }) => resolve([data, channel.port1])
          client.postMessage(
            {
              url: reqUrl,
              method,
              headers: Object.fromEntries(headers.entries()),
              scope,
              destination,
              type: "webtorrent",
            },
            [channel.port2],
          )
        }
      })

      if (response.body !== "STREAM") {
        port.postMessage(false)
        return new Response(response.body, response)
      }

      let timeout = null
      const cleanup = () => {
        port.postMessage(false)
        clearTimeout(timeout)
        port.onmessage = null
      }

      return new Response(
        new ReadableStream({
          pull: (controller) =>
            new Promise((resolve) => {
              port.onmessage = ({ data }) => {
                if (data) {
                  controller.enqueue(data)
                } else {
                  cleanup()
                  controller.close()
                }
                resolve()
              }

              if (!cancelled) {
                clearTimeout(timeout)
                if (destination !== "document") {
                  timeout = setTimeout(() => {
                    cleanup()
                    resolve()
                  }, 5000)
                }
              }

              port.postMessage(true)
            }),
          cancel() {
            cleanup()
          },
        }),
        response,
      )
    })(),
  )
})

// ============================================
// 🔹 PUSH УВЕДОМЛЕНИЯ (ваш текущий код)
// ============================================
function formatNotificationBody(baseBody, messageCount) {
  if (messageCount && messageCount > 1) {
    return `(${messageCount}) ${baseBody}`
  }
  return baseBody
}

self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title || "Новое уведомление"
  const tag = data.tag || `chat-${data.data?.conversationId || "default"}`
  const renotify = data.renotify !== false
  const messageCount = data.data?.messageCount
  const body = formatNotificationBody(data.body || "", messageCount)

  const options = {
    body,
    icon: data.icon || "/logo.png",
    badge: data.badge || "/logo.png",
    tag,
    renotify,
    data: {
      url: data.url,
      conversationId: data.data?.conversationId,
      type: data.data?.type,
    },
    timestamp: data.timestamp || Date.now(),
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", function (event) {
  event.notification.close()
  const { url } = event.notification.data

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const matchingClient = windowClients.find((client) => {
          if (url) return client.url.includes(url)
          return false
        })

        if (matchingClient && "focus" in matchingClient) {
          return matchingClient.focus()
        }

        if (clients.openWindow) {
          return clients.openWindow(url || "/")
        }
      })
      .catch((err) => {
        console.error("❌ Error handling notification click:", err)
        if (url && clients.openWindow) return clients.openWindow(url)
      }),
  )
})

self.addEventListener("notificationclose", function (event) {
  console.log("🔕 Notification closed:", event.notification.tag)
})

self.addEventListener("notificationerror", function (event) {
  console.error("❌ Notification error:", event)
})

// ============================================
// 🔹 УДАЛЕНИЕ ФАЙЛОВ ТОРРЕНТА (будущее)
// ============================================
self.addEventListener("message", async (event) => {
  if (event.data?.type === "DELETE_TORRENT") {
    const { hash } = event.data
    try {
      const root = await navigator.storage.getDirectory()
      await root.removeEntry(hash, { recursive: true })
      event.ports[0]?.postMessage({ success: true })
      console.log(`✅ Торрент ${hash} удалён`)
    } catch (e) {
      event.ports[0]?.postMessage({ success: false, error: e.message })
      console.warn(`❌ Ошибка удаления ${hash}:`, e)
    }
  }
})

// // public/service-worker.js

// // 🔹 Вспомогательная функция: форматирование тела уведомления со счётчиком
// function formatNotificationBody(baseBody, messageCount) {
//   if (messageCount && messageCount > 1) {
//     return `(${messageCount}) ${baseBody}`
//   }
//   return baseBody
// }

// // 1. Слушаем событие получения пуш-уведомления
// self.addEventListener("push", function (event) {
//   // Получаем данные из события
//   const data = event.data ? event.data.json() : {}

//   const title = data.title || "Новое уведомление"

//   // 🔹 Извлекаем новые поля для группировки
//   const tag = data.tag || `chat-${data.data?.conversationId || "default"}`
//   const renotify = data.renotify !== false // по умолчанию true
//   const messageCount = data.data?.messageCount

//   // 🔹 Форматируем тело: добавляем счётчик если есть
//   const body = formatNotificationBody(data.body || "", messageCount)

//   const options = {
//     body: body,
//     icon: data.icon || "/logo.png",
//     badge: data.badge || "/logo.png",

//     // 🔑 КЛЮЧЕВЫЕ ПОЛЯ ДЛЯ ГРУППИРОВКИ:
//     tag: tag, // ← Одинаковый tag = уведомления группируются
//     renotify: renotify, // ← Звук при каждом обновлении

//     // Данные для клика
//     data: {
//       url: data.url,
//       conversationId: data.data?.conversationId,
//       type: data.data?.type,
//     },

//     // // 🔹 Кнопки действий (опционально)
//     // actions: [
//     //   {
//     //     action: "open",
//     //     title: "Открыть",
//     //   },
//     // ],

//     // 🔹 Время уведомления (для сортировки)
//     timestamp: data.timestamp || Date.now(),
//   }

//   // Показываем (или обновляем) уведомление
//   event.waitUntil(self.registration.showNotification(title, options))
// })

// // 2. Обрабатываем клик по уведомлению
// self.addEventListener(
//   "notificationclick",
//   function (event) {
//     event.notification.close()

//     const {
//       url,
//       //  conversationId
//     } = event.notification.data

//     // 🔹 Если нажали "Открыть" или просто кликнули
//     // if (!event.action || event.action === "open") {
//     event.waitUntil(
//       // 🔹 Ищем уже открытые вкладки нашего приложения
//       clients
//         .matchAll({ type: "window", includeUncontrolled: true })
//         .then((windowClients) => {
//           // 🔹 Ищем вкладку, которая уже открыта на нужную страницу
//           const matchingClient = windowClients.find((client) => {
//             // Проверяем, содержит ли URL нужную страницу чата
//             if (url) {
//               return client.url.includes(url)
//             }
//             return false
//           })

//           // 🔹 Если нашли — фокусируем её
//           if (matchingClient && "focus" in matchingClient) {
//             return matchingClient.focus()
//           }

//           // 🔹 Если нет — открываем новую вкладку
//           if (clients.openWindow) {
//             return clients.openWindow(url || "/")
//           }
//         })
//         .catch((err) => {
//           console.error("❌ Error handling notification click:", err)
//           // Фоллбэк: просто открываем новую вкладку
//           if (url && clients.openWindow) {
//             return clients.openWindow(url)
//           }
//         }),
//     )
//   },
//   // }
// )

// // 🔹 (Опционально) Обработка закрытия уведомления
// self.addEventListener("notificationclose", function (event) {
//   // Можно отправить аналитику: пользователь закрыл уведомление не читая
//   console.log("🔕 Notification closed:", event.notification.tag)
// })

// // 🔹 (Опционально) Обработка ошибок показа уведомления
// self.addEventListener("notificationerror", function (event) {
//   console.error("❌ Notification error:", event)
// })
