// src/hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from "react"
import {
  registerServiceWorker,
  requestPushSubscription,
  unsubscribeFromPush,
  type PushSubscriptionJSON,
} from "@/lib/push-client"
import { userAPI } from "@/api/api" // Ваш экземпляр axios

// Состояние хука
export type PushNotificationState = {
  permission: NotificationPermission | "prompt" | "unsupported"
  loading: boolean
  error: string | null
  subscription: PushSubscriptionJSON | null
  isSubscribed: boolean
}

// Возвращаемые методы
export type PushNotificationActions = {
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  refreshPermission: () => Promise<void>
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    permission: "prompt",
    loading: false,
    error: null,
    subscription: null,
    isSubscribed: false,
  })

  // 1. При монтировании: проверяем текущее состояние
  useEffect(() => {
    let mounted = true

    const init = async () => {
      // Проверка поддержки API
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState((prev) => ({ ...prev, permission: "unsupported" }))
        return
      }

      try {
        // Проверяем текущее разрешение
        const permission = Notification.permission
        if (mounted) {
          setState((prev) => ({ ...prev, permission }))
        }

        // Если разрешение есть — пробуем получить активную подписку
        if (permission === "granted") {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()

          if (mounted && subscription) {
            const subscriptionJSON =
              subscription.toJSON() as PushSubscriptionJSON
            setState((prev) => ({
              ...prev,
              subscription: subscriptionJSON,
              isSubscribed: true,
            }))
          }
        }
      } catch (err) {
        console.error("Ошибка инициализации пушей:", err)
        if (mounted) {
          setState((prev) => ({
            ...prev,
            error: "Не удалось проверить статус подписки",
          }))
        }
      }
    }

    init()
    return () => {
      mounted = false
    }
  }, [])

  // 2. Метод подписки
  const subscribe = useCallback(async () => {
    console.log("🔔 [PUSH] === НАЧАЛО ПОДПИСКИ ===")
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      // --- ШАГ 1: Регистрация сервис-воркера ---
      console.log("🔵 [PUSH] Шаг 1: Регистрация Service Worker...")
      const registration = await registerServiceWorker()
      console.log(
        "✅ [PUSH] Шаг 1 завершён. SW активен:",
        registration.active?.scriptURL,
      )

      // --- ШАГ 2: Проверка VAPID ключа ---
      console.log("🔵 [PUSH] Шаг 2: Проверка VAPID_PUBLIC_KEY...")
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()

      if (!vapidKey) {
        throw new Error("VAPID_PUBLIC_KEY не найден в .env.local")
      }

      console.log("🔑 [DEBUG] VAPID ключ (полный):", vapidKey)
      console.log("🔑 [DEBUG] Длина ключа:", vapidKey.length)
      console.log(
        "🔑 [DEBUG] Содержит ли пробелы/переносы:",
        /[\s\n\r]/.test(vapidKey),
      )
      console.log('🔑 [DEBUG] Содержит ли "=" в конце:', vapidKey.endsWith("="))

      console.log(
        "✅ [PUSH] Шаг 2 завершён. Ключ найден (начало):",
        vapidKey.slice(0, 20) + "...",
      )

      // --- ШАГ 3: Запрос подписки у браузера ---
      console.log(
        "🔵 [PUSH] Шаг 3: Запрос подписки у браузера (может занять время)...",
      )
      const result = await requestPushSubscription(vapidKey)

      if (!result.success) {
        console.error("❌ [PUSH] Шаг 3 провален. Ошибка:", result.error)
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.error,
          permission: result.permission ?? prev.permission,
        }))
        return false
      }

      console.log("✅ [PUSH] Шаг 3 завершён. Подписка получена:", {
        endpoint: result.subscription.endpoint.slice(0, 50) + "...",
        hasP256dh: !!result.subscription.keys.p256dh,
        hasAuth: !!result.subscription.keys.auth,
      })

      // --- ШАГ 4: Отправка подписки на сервер ---
      console.log("🔵 [PUSH] Шаг 4: Отправка подписки на сервер...")
      console.log("📤 [PUSH] POST /api/user/push-subscription/save")

      const response = await userAPI.savePushSubscription(result.subscription)
      console.log("✅ [PUSH] Шаг 4 завершён. Ответ сервера:", response)

      // --- ШАГ 5: Обновление состояния ---
      console.log("🔵 [PUSH] Шаг 5: Обновление состояния хука...")
      setState((prev) => ({
        ...prev,
        loading: false,
        subscription: result.subscription,
        isSubscribed: true,
        permission: "granted",
      }))

      console.log("🎉 [PUSH] === ПОДПИСКА УСПЕШНО ЗАВЕРШЕНА ===")
      return true
    } catch (err) {
      console.error("❌ [PUSH] === КРИТИЧЕСКАЯ ОШИБКА ===")
      console.error(
        "🔴 [PUSH] Тип ошибки:",
        err instanceof Error ? err.name : "Unknown",
      )
      console.error(
        "🔴 [PUSH] Сообщение:",
        err instanceof Error ? err.message : err,
      )
      console.error(
        "🔴 [PUSH] Stack:",
        err instanceof Error ? err.stack : "No stack",
      )

      const errorMessage =
        err instanceof Error ? err.message : "Неизвестная ошибка подписки"
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      return false
    }
  }, [])
  //   // 2. Метод подписки
  //   const subscribe = useCallback(async () => {
  //     console.log('🔄 [PUSH] Начало подписки...')
  //     setState((prev) => ({ ...prev, loading: true, error: null }))

  //     try {
  //       // 2.1. Регистрируем сервис-воркер (если ещё не зарегистрирован)
  //       const registration =await registerServiceWorker()
  // console.log('✅ [PUSH] Service Worker зарегистрирован:', registration.active?.scriptURL)
  //       // 2.2. Запрашиваем подписку (используем ваш VAPID ключ из env)
  //       const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  //       if (!vapidKey) {
  //         throw new Error("VAPID_PUBLIC_KEY не найден в переменных окружения")
  //       }

  //       const result = await requestPushSubscription(vapidKey)

  //       if (!result.success) {
  //         setState((prev) => ({
  //           ...prev,
  //           loading: false,
  //           error: result.error,
  //           permission: result.permission ?? prev.permission,
  //         }))
  //         return false
  //       }

  //       // 2.3. Отправляем подписку на ваш сервер через axios instance
  //       await userAPI.savePushSubscription(result.subscription)

  //       // 2.4. Обновляем состояние
  //       setState((prev) => ({
  //         ...prev,
  //         loading: false,
  //         subscription: result.subscription,
  //         isSubscribed: true,
  //         permission: "granted",
  //       }))

  //       return true
  //     } catch (err) {
  //       const errorMessage =
  //         err instanceof Error ? err.message : "Ошибка подписки"
  //       setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
  //       return false
  //     }
  //   }, [])

  // 3. Метод отписки
  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      // 3.1. Отписываемся на уровне браузера
      const success = await unsubscribeFromPush()
      if (!success) {
        throw new Error("Не удалось отписаться от пушей")
      }

      // 3.2. Сообщаем серверу об удалении подписки
      await userAPI.removePushSubscription()

      // 3.3. Обновляем состояние
      setState((prev) => ({
        ...prev,
        loading: false,
        subscription: null,
        isSubscribed: false,
      }))

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ошибка отписки"
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
      return false
    }
  }, [])

  // 4. Метод обновления статуса разрешения (если пользователь изменил его в настройках браузера)
  const refreshPermission = useCallback(async () => {
    const permission = Notification.permission
    setState((prev) => ({ ...prev, permission }))

    if (permission === "granted") {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        const subscriptionJSON = subscription.toJSON() as PushSubscriptionJSON
        setState((prev) => ({
          ...prev,
          subscription: subscriptionJSON,
          isSubscribed: true,
        }))
      }
    }
  }, [])

  return {
    ...state,
    subscribe,
    unsubscribe,
    refreshPermission,
  }
}
