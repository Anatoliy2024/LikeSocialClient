// Вспомогательная функция
export const getMessagePreview = (type: string) => {
  // if (type === "text") return text?.substring(0, 18)
  if (type === "image") return "🖼 Фотография"
  if (type === "sticker") return "🎭 Стикер"
  //   if (message.video) return "🎥 Видео"
  //   if (message.audio) return "🎵 Голосовое сообщение"
  //   if (message.file) return "📎 Файл"
  return "Новое сообщение"
}
// export const getMessagePreview = (message) => {
//   if (message.type === "text") return message.text.substring(0, 80)
//   if (message.type === "image") return "🖼 Фотография"
//   if (message.type === "sticker") return "🎭 Стикер"
//   //   if (message.video) return "🎥 Видео"
//   //   if (message.audio) return "🎵 Голосовое сообщение"
//   //   if (message.file) return "📎 Файл"
//   return "Новое сообщение"
// }
