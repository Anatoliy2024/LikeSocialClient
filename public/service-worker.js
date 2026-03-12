// public/service-worker.js

// 🔹 Вспомогательная функция: форматирование тела уведомления со счётчиком
function formatNotificationBody(baseBody, messageCount) {
  if (messageCount && messageCount > 1) {
    return `(${messageCount}) ${baseBody}`
  }
  return baseBody
}

// 1. Слушаем событие получения пуш-уведомления
self.addEventListener("push", function (event) {
  // Получаем данные из события
  const data = event.data ? event.data.json() : {}

  const title = data.title || "Новое уведомление"

  // 🔹 Извлекаем новые поля для группировки
  const tag = data.tag || `chat-${data.data?.conversationId || "default"}`
  const renotify = data.renotify !== false // по умолчанию true
  const messageCount = data.data?.messageCount

  // 🔹 Форматируем тело: добавляем счётчик если есть
  const body = formatNotificationBody(data.body || "", messageCount)

  const options = {
    body: body,
    icon: data.icon || "/logo.png",
    badge: data.badge || "/logo.png",

    // 🔑 КЛЮЧЕВЫЕ ПОЛЯ ДЛЯ ГРУППИРОВКИ:
    tag: tag, // ← Одинаковый tag = уведомления группируются
    renotify: renotify, // ← Звук при каждом обновлении

    // Данные для клика
    data: {
      url: data.url,
      conversationId: data.data?.conversationId,
      type: data.data?.type,
    },

    // // 🔹 Кнопки действий (опционально)
    // actions: [
    //   {
    //     action: "open",
    //     title: "Открыть",
    //   },
    // ],

    // 🔹 Время уведомления (для сортировки)
    timestamp: data.timestamp || Date.now(),
  }

  // Показываем (или обновляем) уведомление
  event.waitUntil(self.registration.showNotification(title, options))
})

// 2. Обрабатываем клик по уведомлению
self.addEventListener(
  "notificationclick",
  function (event) {
    event.notification.close()

    const {
      url,
      //  conversationId
    } = event.notification.data

    // 🔹 Если нажали "Открыть" или просто кликнули
    // if (!event.action || event.action === "open") {
    event.waitUntil(
      // 🔹 Ищем уже открытые вкладки нашего приложения
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients) => {
          // 🔹 Ищем вкладку, которая уже открыта на нужную страницу
          const matchingClient = windowClients.find((client) => {
            // Проверяем, содержит ли URL нужную страницу чата
            if (url) {
              return client.url.includes(url)
            }
            return false
          })

          // 🔹 Если нашли — фокусируем её
          if (matchingClient && "focus" in matchingClient) {
            return matchingClient.focus()
          }

          // 🔹 Если нет — открываем новую вкладку
          if (clients.openWindow) {
            return clients.openWindow(url || "/")
          }
        })
        .catch((err) => {
          console.error("❌ Error handling notification click:", err)
          // Фоллбэк: просто открываем новую вкладку
          if (url && clients.openWindow) {
            return clients.openWindow(url)
          }
        }),
    )
  },
  // }
)

// 🔹 (Опционально) Обработка закрытия уведомления
self.addEventListener("notificationclose", function (event) {
  // Можно отправить аналитику: пользователь закрыл уведомление не читая
  console.log("🔕 Notification closed:", event.notification.tag)
})

// 🔹 (Опционально) Обработка ошибок показа уведомления
self.addEventListener("notificationerror", function (event) {
  console.error("❌ Notification error:", event)
})

// // public/service-worker.js

// // 1. Слушаем событие получения пуш-уведомления
// self.addEventListener("push", function (event) {
//   // Получаем данные из события (если они есть)
//   const data = event.data ? event.data.json() : {}
//   const title = data.title || "Новое уведомление"
//   const options = {
//     body: data.body || "",
//     icon: data.icon || "/logo.png", // Путь к иконке в папке public
//     badge: data.badge || "/logo.png",
//     data: data.url ? { url: data.url } : undefined, // Данные для перехода по клику
//   }

//   // Показываем уведомление пользователю
//   event.waitUntil(self.registration.showNotification(title, options))
// })

// // 2. Обрабатываем клик по уведомлению
// self.addEventListener("notificationclick", function (event) {
//   event.notification.close() // Закрываем уведомление

//   // Если есть ссылка для перехода — открываем её
//   if (event.notification.data?.url) {
//     event.waitUntil(clients.openWindow(event.notification.data.url))
//   }
// })
