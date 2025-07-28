export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    // Вернуть часы и минуты, например "14:23"
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } else {
    // Вернуть дату и месяц, например "27 июл"
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    })
  }
}
