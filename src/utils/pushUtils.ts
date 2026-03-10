// // utils/pushUtils.ts

// import { PushDevice } from "@/store/slices/pushDevicesSlice"

// // Тип для удобства (можно импортировать из push-client.ts, если там есть)
// type PushSubscriptionType = PushSubscription | null

// /**
//  * Получает хэш (отпечаток) текущей активной подписки
//  * @returns Promise<string | null> — первые 20 символов endpoint или null
//  */
// export async function getCurrentEndpointHash(): Promise<string | null> {
//   // 1. Проверка на SSR
//   if (typeof window === "undefined") return null

//   try {
//     // 2. Получаем регистрацию сервис-воркера (не controller!)
//     // ready() возвращает Promise<ServiceWorkerRegistration>
//     if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
//       return null
//     }

//     const registration = await navigator.serviceWorker.ready

//     // 3. Получаем текущую подписку
//     const subscription: PushSubscriptionType =
//       await registration.pushManager.getSubscription()

//     if (!subscription) return null

//     // 4. Возвращаем "отпечаток" endpoint (первые 20 символов достаточно для сравнения)
//     return subscription.endpoint.slice(0, 20)
//   } catch (err) {
//     console.warn("⚠️ Не удалось получить хэш текущей подписки:", err)
//     return null
//   }
// }

// /**
//  * Помечает текущее устройство в списке
//  */
// export function markCurrentDeviceInList(
//   devices: PushDevice[],
//   currentHash: string | null,
// ): PushDevice[] {
//   if (!currentHash) return devices

//   return devices.map((device) => ({
//     ...device,
//     isCurrent: device.endpoint.startsWith(currentHash),
//   }))
// }
