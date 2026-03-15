// Вспомогательная функция
export const getMessagePreview = (type: string) => {
  if (type === "image") return "🖼 Фотография"
  if (type === "sticker") return "🎭 Стикер"
  //   if (message.video) return "🎥 Видео"
  //   if (message.audio) return "🎵 Голосовое сообщение"
  //   if (message.file) return "📎 Файл"
  return "Новое сообщение"
}
