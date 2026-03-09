// public/service-worker.js

// 1. Слушаем событие получения пуш-уведомления
self.addEventListener("push", function (event) {
  // Получаем данные из события (если они есть)
  const data = event.data ? event.data.json() : {}
  const title = data.title || "Новое уведомление"
  const options = {
    body: data.body || "",
    icon: data.icon || "/logo.png", // Путь к иконке в папке public
    badge: data.badge || "/logo.png",
    data: data.url ? { url: data.url } : undefined, // Данные для перехода по клику
  }

  // Показываем уведомление пользователю
  event.waitUntil(self.registration.showNotification(title, options))
})

// 2. Обрабатываем клик по уведомлению
self.addEventListener("notificationclick", function (event) {
  event.notification.close() // Закрываем уведомление

  // Если есть ссылка для перехода — открываем её
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})
