// src/utils/getVideoDevices.ts

export interface VideoDevice {
  deviceId: string
  label: string
  kind: "videoinput"
}

export async function getVideoDevices(): Promise<VideoDevice[]> {
  try {
    // 🔹 enumerateDevices вернёт пустые label, если нет активного разрешения на камеру
    // Но если пользователь уже разрешил камеру в handleToggleVideo — label будут заполнены
    const devices = await navigator.mediaDevices.enumerateDevices()

    const videoDevices = devices
      .filter((device) => device.kind === "videoinput")
      .map((device) => ({
        deviceId: device.deviceId,
        // 🔹 Если label пустой — браузер не дал разрешение или это приватный режим
        label: device.label || `Camera ${device.deviceId.slice(0, 8)}...`,
        kind: "videoinput" as const,
      }))

    return videoDevices
  } catch (err) {
    console.error("❌ Не удалось получить список камер:", err)
    return []
  }
}

export function getOppositeCamera(
  currentDeviceId: string,
  devices: VideoDevice[],
): string | null {
  if (devices.length < 2) return null

  const currentIndex = devices.findIndex((d) => d.deviceId === currentDeviceId)
  if (currentIndex === -1) return devices[0]?.deviceId || null

  // Переключаем: 0 → 1, 1 → 0 (для 2 камер)
  // Или циклично для большего количества
  const nextIndex = (currentIndex + 1) % devices.length
  return devices[nextIndex].deviceId
}

// 🔹 Опционально: определить, фронтальная ли камера по названию
export function isFrontCamera(device: VideoDevice): boolean {
  const label = device.label.toLowerCase()
  return (
    label.includes("front") || label.includes("user") || label.includes("face")
  )
}
