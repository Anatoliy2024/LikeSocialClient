// // hooks/useNotification.ts
// "use client"

// import { useEffect, useState, useCallback } from "react"
// import { messaging, getToken, onMessage } from "@/lib/firebase"
// import type { Unsubscribe } from "firebase/messaging"
// // import { fcmTokenAPI } from "@/api/fcmTokenAPI"
// import { getPlatform } from "@/utils/getPlatform"
// import { userAPI } from "@/api/api"

// export function useNotification() {
//   // 🔥 Стейты
//   const [token, setToken] = useState<string | null>(null)
//   const [permission, setPermission] =
//     useState<NotificationPermission>("default")
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   // 🔥 Флаг монтирования (для гидратации)
//   const [isMounted, setIsMounted] = useState(false)

//   // 🔥 Подписка на сообщения (чтобы отписаться при размонтировании)
//   const [messageListener, setMessageListener] = useState<Unsubscribe | null>(
//     null,
//   )

//   // ✅ 1. После монтирования синхронизируемся с браузером
//   useEffect(() => {
//     setIsMounted(true)
//     if (typeof window !== "undefined" && "Notification" in window) {
//       // Читаем реальный статус разрешения
//       const currentPermission = Notification.permission
//       setPermission(currentPermission)

//       // Если уже разрешено — сразу получаем токен
//       if (currentPermission === "granted" && messaging) {
//         fetchAndSaveToken()
//       }
//     }

//     return () => {
//       // Чистим подписку при размонтировании
//       if (messageListener) {
//         messageListener()
//       }
//     }
//   }, [])

//   // ✅ 2. Функция получения и сохранения токена (вынесена отдельно)
//   const fetchAndSaveToken = useCallback(async () => {
//     if (!messaging) {
//       console.error("❌ Firebase Messaging не инициализирован")
//       return
//     }

//     try {
//       // Явно регистрируем SW
//       await navigator.serviceWorker.register("/firebase-messaging-sw.js")
//       // ready возвращает готовый SW, используй его
//       const readyRegistration = await navigator.serviceWorker.ready

//       const currentToken = await getToken(messaging, {
//         vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
//         serviceWorkerRegistration: readyRegistration, // вот так
//       })

//       if (currentToken) {
//         setToken(currentToken)

//         console.log("🎫 FCM Token:", currentToken)

//         // 🚀 Отправляем на бэкенд
//         // await fcmTokenAPI.saveFcmToken(currentToken)
//         await userAPI.saveFcmToken(currentToken, getPlatform())
//         console.log("✅ Токен сохранён на сервере")
//       }
//     } catch (err) {
//       console.error("❌ Ошибка получения токена:", err)
//       setError("Не удалось получить токен уведомлений")
//     }
//   }, [])

//   // ✅ 3. Основная функция: запрос разрешения
//   const requestPermission = useCallback(async () => {
//     if (!messaging) {
//       setError("Firebase Messaging не доступен")
//       return
//     }

//     try {
//       setLoading(true)
//       setError(null)

//       // Запрашиваем разрешение у браузера
//       const result = await Notification.requestPermission()
//       setPermission(result)

//       if (result === "granted") {
//         await fetchAndSaveToken()
//       } else if (result === "denied") {
//         console.warn("⚠️ Пользователь заблокировал уведомления")
//         setError("Уведомления заблокированы в настройках браузера")
//       }
//     } catch (err) {
//       console.error("❌ Ошибка запроса разрешения:", err)
//       setError("Произошла ошибка при настройке уведомлений")
//       alert("Произошла ошибка при настройке уведомлений")
//     } finally {
//       setLoading(false)
//     }
//   }, [fetchAndSaveToken])

//   const clearTokens = useCallback(async () => {
//     try {
//       await userAPI.dellAllFcmTokens()
//       setToken(null)
//       setPermission("default")

//       console.log("✅ Токены очищены")
//     } catch (err) {
//       console.error("❌ Ошибка очистки токенов:", err)
//       alert("Ошибка очистки токенов")
//     }
//   }, [])

//   // ✅ 4. Подписка на сообщения в фоне (когда вкладка активна)
//   useEffect(() => {
//     if (!messaging || permission !== "granted") return

//     const unsubscribe = onMessage(messaging, (payload) => {
//       console.log("📨 Получено сообщение в фоне:", payload)

//       // 🔔 Здесь можно показать кастомное уведомление в интерфейсе
//       // Например, через toast-библиотеку
//       if (payload.notification?.title) {
//         // new Toast({ title: payload.notification.title, ... })
//       }
//     })

//     setMessageListener(() => unsubscribe)

//     return () => {
//       unsubscribe()
//     }
//   }, [messaging, permission])

//   // ✅ 5. Возвращаем всё, что нужно компоненту
//   return {
//     token,
//     permission,
//     loading,
//     error,
//     isReady: isMounted && messaging !== null,
//     requestPermission,
//     // Экспортируем на случай, если нужно вызвать вручную
//     refreshToken: fetchAndSaveToken,
//     clearTokens,
//   }
// }
