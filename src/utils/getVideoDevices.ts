// src/utils/getVideoDevices.ts

export interface VideoDevice {
  deviceId: string
  label: string
  kind: "videoinput"
  facingMode?: "user" | "environment" // 🔹 Добавили подсказку
}

export async function getVideoDevices(): Promise<VideoDevice[]> {
  try {
    // 🔹 enumerateDevices вернёт пустые label, если нет активного разрешения на камеру
    // Но если пользователь уже разрешил камеру в handleToggleVideo — label будут заполнены
    const devices = await navigator.mediaDevices.enumerateDevices()

    const videoDevices = devices
      .filter((device) => device.kind === "videoinput")
      .map((device) => {
        const label = device.label.toLowerCase()

        // 🔹 Определяем facingMode по названию устройства
        let facingMode: "user" | "environment" | undefined

        if (
          label.includes("front") ||
          label.includes("user") ||
          label.includes("face") ||
          label.includes("selfie")
        ) {
          facingMode = "user"
        } else if (
          label.includes("back") ||
          label.includes("rear") ||
          label.includes("environment") ||
          label.includes("wide")
        ) {
          facingMode = "environment"
        }

        return {
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}...`,
          kind: "videoinput" as const,
          facingMode,
        }
      })

    const filtered = filterToMainCameras(videoDevices)

    return filtered
  } catch (err) {
    console.error("❌ Не удалось получить список камер:", err)
    return []
  }
}

// 🔹 Главная функция фильтрации
function filterToMainCameras(devices: VideoDevice[]): VideoDevice[] {
  if (devices.length === 0) return []

  // Разделяем на фронтальные и задние
  const frontCameras = devices.filter((d) => d.facingMode === "user")
  const backCameras = devices.filter((d) => d.facingMode === "environment")

  const result: VideoDevice[] = []

  // 🔹 Выбираем ОДНУ фронтальную (первую по списку)
  if (frontCameras.length > 0) {
    result.push(frontCameras[0])
  }

  // 🔹 Выбираем ОДНУ заднюю — предпочитаем "wide" (основную), а не ultra/tele/macro
  if (backCameras.length > 0) {
    const mainBack = selectMainBackCamera(backCameras)
    result.push(mainBack)
  }

  // 🔹 Если фильтрация не сработала — берём первые две как фоллбэк
  if (result.length === 0 && devices.length >= 2) {
    return [devices[0], devices[1]]
  }

  return result
}

// 🔹 Выбираем "основную" заднюю камеру из списка
function selectMainBackCamera(cameras: VideoDevice[]): VideoDevice {
  // Приоритет по ключевым словам в названии
  const priority = [
    "wide",
    "main",
    "back",
    "rear",
    "primary",
    "1x",
    "normal",
    "ultra",
    "tele",
    "macro",
    "depth",
    "tof",
    "2x",
    "3x",
    "5x",
  ]

  // Сортируем: камеры с "wide"/"main" в начале, ультра-широкие/теле в конце
  const sorted = [...cameras].sort((a, b) => {
    const aLabel = a.label.toLowerCase()
    const bLabel = b.label.toLowerCase()

    const aScore = priority.findIndex((kw) => aLabel.includes(kw))
    const bScore = priority.findIndex((kw) => bLabel.includes(kw))

    // Меньший индекс = выше приоритет (-1 если не найдено)
    return (aScore === -1 ? 999 : aScore) - (bScore === -1 ? 999 : bScore)
  })

  return sorted[0]
}

// 🔹 Переключение между двумя камерами (упрощённая версия)
export function getOppositeCamera(
  currentDeviceId: string,
  devices: VideoDevice[],
): string | null {
  if (devices.length < 2) return null

  const currentIndex = devices.findIndex((d) => d.deviceId === currentDeviceId)
  if (currentIndex === -1) return devices[0]?.deviceId || null

  // Переключаем: 0 ↔ 1 (только две камеры в списке)
  const nextIndex = currentIndex === 0 ? 1 : 0
  return devices[nextIndex].deviceId
}

// // 🔹 Опционально: определить, фронтальная ли камера по названию
// export function isFrontCamera(device: VideoDevice): boolean {
//   const label = device.label.toLowerCase()
//   return (
//     label.includes("front") || label.includes("user") || label.includes("face")
//   )
// }
export function isFrontCamera(
  deviceId: string,
  devices: VideoDevice[],
): boolean {
  const device = devices.find((d) => d.deviceId === deviceId)
  if (!device) return false

  const label = device.label.toLowerCase()
  return (
    label.includes("front") ||
    label.includes("user") ||
    label.includes("face") ||
    label.includes("selfie")
  )
}

// /**
//  * 🔹 Определяет, является ли камера задней
//  */
// export function isBackCamera(
//   deviceId: string,
//   devices: VideoDevice[],
// ): boolean {
//   const device = devices.find((d) => d.deviceId === deviceId)
//   if (!device) return false

//   const label = device.label.toLowerCase()

//   // 🔹 Ключевые слова для задней камеры
//   return (
//     label.includes("back") ||
//     label.includes("rear") ||
//     label.includes("environment") ||
//     label.includes("wide") ||
//     label.includes("main") ||
//     label.includes("primary")
//   )
// }
