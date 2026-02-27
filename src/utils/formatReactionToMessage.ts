export const formatMessageDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  const time = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (isToday) {
    return `Сегодня в ${time}`
  }

  if (isYesterday) {
    return `Вчера в ${time}`
  }

  const day = date.getDate()

  const month = date.toLocaleDateString("ru-RU", {
    month: "long",
  })

  const isCurrentYear = date.getFullYear() === now.getFullYear()

  if (isCurrentYear) {
    return `${day} ${month} в ${time}`
  }

  return `${day} ${month} ${date.getFullYear()} в ${time}`
}
