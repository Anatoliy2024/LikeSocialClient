export function formatDateEditMessage(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()

  const day = date.getDate()
  //   const monthNames = [
  //     "янв.",
  //     "фев.",
  //     "мар.",
  //     "апр.",
  //     "май",
  //     "июн.",
  //     "июл.",
  //     "авг.",
  //     "сен.",
  //     "окт.",
  //     "ноя.",
  //     "дек.",
  //   ]
  const monthNames = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ]
  const month = monthNames[date.getMonth()]

  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  if (year === now.getFullYear()) {
    return `${day} ${month} в ${hours}:${minutes}`
  } else {
    return `${day} ${month} ${year} в ${hours}:${minutes}`
  }
}
