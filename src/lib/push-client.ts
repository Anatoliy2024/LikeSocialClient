// src/lib/push-client.ts

export type PushSubscriptionJSON = {
  endpoint: string
  expirationTime?: string | null
  keys: {
    p256dh: string
    auth: string
  }
}

export type SubscribeResult =
  | { success: true; subscription: PushSubscriptionJSON }
  | { success: false; error: string; permission?: NotificationPermission }

// 1. Регистрация сервис-воркера
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker не поддерживается в этом браузере")
  }

  await navigator.serviceWorker.register("/service-worker.js", { scope: "/" })

  // ready резолвится только когда воркер активен — надёжнее чем слушать statechange
  return navigator.serviceWorker.ready
}

// 2. Запрос подписки
export async function requestPushSubscription(
  vapidPublicKey: string,
  retries = 2,
): Promise<SubscribeResult> {
  try {
    if (!("PushManager" in window)) {
      return { success: false, error: "Push API не поддерживается" }
    }

    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      return {
        success: false,
        error: `Разрешение не получено: ${permission}`,
        permission,
      }
    }

    const registration = await navigator.serviceWorker.ready

    // Проверяем существующую подписку
    const existingSubscription =
      await registration.pushManager.getSubscription()
    if (existingSubscription) {
      return {
        success: true,
        subscription: existingSubscription.toJSON() as PushSubscriptionJSON,
      }
    }

    // Создаём новую
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBufferSource(vapidPublicKey),
    })

    const subscriptionJSON = subscription.toJSON() as PushSubscriptionJSON

    if (
      !subscriptionJSON.endpoint ||
      !subscriptionJSON.keys?.p256dh ||
      !subscriptionJSON.keys?.auth
    ) {
      throw new Error("Неполные данные подписки")
    }

    return { success: true, subscription: subscriptionJSON }
  } catch (err) {
    // Если ошибка push service и есть ещё попытки — тихий retry
    if (
      retries > 0 &&
      err instanceof Error &&
      err.message.toLowerCase().includes("push service error")
    ) {
      console.log(
        `🔄 Push service error, retry... осталось попыток: ${retries}`,
      )
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return requestPushSubscription(vapidPublicKey, retries - 1)
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Неизвестная ошибка подписки",
    }
  }
}

// 3. Получить текущую подписку браузера (без запроса разрешения)
export async function getCurrentBrowserSubscription(): Promise<PushSubscriptionJSON | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null

  try {
    // const registration = await navigator.serviceWorker.ready
    const registration = await withTimeout(
      navigator.serviceWorker.ready,
      3000,
      null,
    )
    if (!registration) {
      console.warn("⚠️ Service Worker не готов, пропускаем отписку")
      return null
    }
    let subscription = null
    try {
      subscription = await registration.pushManager?.getSubscription()
    } catch (pushErr) {
      console.warn("⚠️ PushManager недоступен:", pushErr)
    }
    // const subscription = await registration.pushManager.getSubscription()
    return subscription ? (subscription.toJSON() as PushSubscriptionJSON) : null
  } catch {
    return null
  }
}

// 4. Отписка в браузере
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator)) return false

    const registration = await withTimeout(
      navigator.serviceWorker.ready,
      3000,
      null,
    )

    if (!registration) {
      console.warn("⚠️ Service Worker не готов, пропускаем отписку")
      return true
    }
    // const registration = await navigator.serviceWorker.ready
    // const subscription = await registration.pushManager.getSubscription()
    let subscription = null
    try {
      subscription = await registration.pushManager?.getSubscription()
    } catch (pushErr) {
      console.warn("⚠️ PushManager недоступен:", pushErr)
    }

    return subscription ? await subscription.unsubscribe() : true
  } catch (err) {
    console.error("Ошибка при отписке:", err)
    return false
  }
}

// 5. Конвертация VAPID ключа
function urlBase64ToBufferSource(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray as BufferSource
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>

  const timeout = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), ms)
  })

  const result = await Promise.race([promise, timeout])
  clearTimeout(timeoutId!)
  return result
}
