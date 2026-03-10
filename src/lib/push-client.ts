// src/lib/push-client.ts

// Тип для объекта подписки, который мы будем отправлять на сервер
// Приводим к простому объекту, чтобы избежать проблем с сериализацией
export type PushSubscriptionJSON = {
  endpoint: string
  expirationTime?: string | null
  keys: {
    p256dh: string
    auth: string
  }
}

// Результат операции подписки
export type SubscribeResult =
  | { success: true; subscription: PushSubscriptionJSON }
  | { success: false; error: string; permission?: NotificationPermission }

// 1. Функция регистрации сервис-воркера
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      {
        scope: "/", // Область действия - весь сайт
      },
    )

    // Ждем, пока воркер не станет активным
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        const worker = registration.installing
        if (!worker) return resolve()

        worker.addEventListener("statechange", () => {
          if (worker.state === "activated") resolve()
        })
      })
    }

    return registration
  }
  throw new Error("Service Worker не поддерживается в этом браузере")
}
// src/lib/push-client.ts

export async function requestPushSubscription(
  vapidPublicKey: string,
): Promise<SubscribeResult> {
  console.log("🔍 [CLIENT] Запрос подписки...")

  try {
    // 1. Проверка поддержки
    if (!("PushManager" in window)) {
      console.warn("⚠️ [CLIENT] Push API не поддерживается")
      return { success: false, error: "Push API не поддерживается" }
    }

    // 2. Запрос разрешения
    console.log("🔐 [CLIENT] Запрос разрешения пользователя...")
    const permission = await Notification.requestPermission()
    console.log("🔐 [CLIENT] Получено разрешение:", permission)

    if (permission !== "granted") {
      return {
        success: false,
        error: `Разрешение не получено: ${permission}`,
        permission,
      }
    }

    // 3. Проверка существующей подписки (важно!)
    console.log("📦 [CLIENT] Проверка существующей подписки...")
    const registration = await navigator.serviceWorker.ready
    const existingSubscription =
      await registration.pushManager.getSubscription()

    if (existingSubscription) {
      console.log("ℹ️ [CLIENT] Подписка уже существует, используем её")
      const subscriptionJSON =
        existingSubscription.toJSON() as PushSubscriptionJSON
      return { success: true, subscription: subscriptionJSON }
    }

    // 4. Создание новой подписки
    console.log("📝 [CLIENT] Создание новой подписки...")
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBufferSource(vapidPublicKey),
    })

    const subscriptionJSON = subscription.toJSON() as PushSubscriptionJSON

    // 5. Валидация
    if (
      !subscriptionJSON.endpoint ||
      !subscriptionJSON.keys?.p256dh ||
      !subscriptionJSON.keys?.auth
    ) {
      console.error("❌ [CLIENT] Неполные данные подписки:", subscriptionJSON)
      throw new Error("Неполные данные подписки")
    }

    console.log("✅ [CLIENT] Подписка успешно создана")
    return { success: true, subscription: subscriptionJSON }
  } catch (err) {
    console.error("❌ [CLIENT] Ошибка в requestPushSubscription:", err)
    const errorMessage =
      err instanceof Error ? err.message : "Неизвестная ошибка подписки"
    return { success: false, error: errorMessage }
  }
}

// // 2. Функция запроса разрешения и получения подписки
// export async function requestPushSubscription(
//   vapidPublicKey: string,
// ): Promise<SubscribeResult> {
//   try {
//     // Проверяем поддержку Push API
//     if (!("PushManager" in window)) {
//       return { success: false, error: "Push API не поддерживается" }
//     }

//     // Запрашиваем разрешение у пользователя
//     const permission = await Notification.requestPermission()

//     if (permission !== "granted") {
//       return {
//         success: false,
//         error: `Разрешение не получено: ${permission}`,
//         permission,
//       }
//     }

//     // Получаем регистрацию сервис-воркера (если ещё не получили)
//     const registration = await navigator.serviceWorker.ready

//     // Подписываемся на пуши с использованием VAPID ключа
//     const subscription = await registration.pushManager.subscribe({
//       userVisibleOnly: true, // Обязательно: все пуши должны показывать уведомление
//       applicationServerKey: urlBase64ToBufferSource(vapidPublicKey),
//     })

//     // Конвертируем подписку в простой объект для отправки на сервер
//     const subscriptionJSON = subscription.toJSON() as PushSubscriptionJSON

//     // Валидация: проверяем, что все необходимые поля на месте
//     if (
//       !subscriptionJSON.endpoint ||
//       !subscriptionJSON.keys?.p256dh ||
//       !subscriptionJSON.keys?.auth
//     ) {
//       throw new Error("Неполные данные подписки")
//     }

//     return { success: true, subscription: subscriptionJSON }
//   } catch (err) {
//     const errorMessage =
//       err instanceof Error ? err.message : "Неизвестная ошибка подписки"
//     return { success: false, error: errorMessage }
//   }
// }

// 3. Вспомогательная функция: конвертация VAPID ключа из base64 в Uint8Array
// Это требуется, потому что applicationServerKey принимает только этот формат
function urlBase64ToBufferSource(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  // Возвращаем как BufferSource - Uint8Array является его подтипом на уровне JS
  return outputArray as BufferSource
}

// // 4. Функция отправки подписки на ваш сервер (опционально, но удобно)
// export async function sendSubscriptionToServer(
//   subscription: PushSubscriptionJSON,
//   apiUrl: string,
// ): Promise<Response> {
//   return fetch(apiUrl, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ subscription }),
//     credentials: "include", // Если используете куки для авторизации
//   })
// }

// 5. Функция для отписки (отмены подписки)
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator)) return false

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      return await subscription.unsubscribe()
    }
    return true // Уже не подписан
  } catch (err) {
    console.error("Ошибка при отписке от пушей:", err)
    return false
  }
}
