// app/manifest.ts
import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LikeSocial",
    short_name: "LikeSocial",
    description: "Социальная сеть",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/logo.png",
        sizes: "100x100", // ✅ Указываем реальный размер вашей иконки
        type: "image/png",
      },
    ],
    // 📸 Скриншоты для "красивого" окна установки (опционально, но убирает варнинги)
    screenshots: [
      {
        src: "/logo.png", // Временно используем логотип как заглушку
        sizes: "100x100",
        type: "image/png",
        form_factor: "wide", // Для десктопа
      },
      {
        src: "/logo.png",
        sizes: "100x100",
        type: "image/png",
        // Без form_factor — для мобильных
      },
    ],
  }
}
