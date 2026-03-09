// // public/firebase-messaging-sw.js
// importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js")
// importScripts(
//   "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js",
// )

// // Инициализация Firebase в Service Worker
// firebase.initializeApp({
//   apiKey: "AIzaSyCWjc87KRxCPeajR74JZoAamODXK9wLwpQ",
//   authDomain: "likesocialmobile.firebaseapp.com",
//   projectId: "likesocialmobile",
//   storageBucket: "likesocialmobile.firebasestorage.app",
//   messagingSenderId: "961756589831",
//   appId: "1:961756589831:web:c747977faaefff2f661fa2",
// })

// const messaging = firebase.messaging()

// // Обработка пушей, когда приложение ЗАКРЫТО или в фоне
// messaging.onBackgroundMessage((payload) => {
//   console.log("[firebase-messaging-sw.js] Получен фоновый пуш:", payload)

//   const notificationTitle = payload.data?.title || "Новое уведомление"
//   const notificationOptions = {
//     body: payload.data?.body || "",
//     icon: "/favicon.ico", // Твой логотип
//     badge: "/favicon.ico",
//     tag: payload.fcmOptions?.link, // Для группировки уведомлений
//     data: {
//       url: payload.fcmOptions?.link || "/", // Куда перейти при клике
//     },
//   }

//   self.registration.showNotification(notificationTitle, notificationOptions)
// })

// // Обработка клика по уведомлению
// self.addEventListener("notificationclick", (event) => {
//   event.notification.close()

//   const urlToOpen = event.notification.data?.url || "/"

//   event.waitUntil(
//     clients
//       .matchAll({ type: "window", includeUncontrolled: true })
//       .then((windowClients) => {
//         // Если есть открытая вкладка - фокусируем её
//         for (const client of windowClients) {
//           if (client.url === urlToOpen && "focus" in client) {
//             return client.focus()
//           }
//         }
//         // Иначе открываем новую
//         if (clients.openWindow) {
//           return clients.openWindow(urlToOpen)
//         }
//       }),
//   )
// })
