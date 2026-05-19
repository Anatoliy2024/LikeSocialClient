export function getHoursMinutes(date: string | null) {
  if (!date) return
  const time = new Date(date)
  const h = time.getHours().toString().padStart(2, "0")
  const m = time.getMinutes().toString().padStart(2, "0")
  return `${h}:${m}`
}
