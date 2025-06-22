export function getAgeFromBirthDate(birthDate: string | null): string {
  if (!birthDate) return ""

  const date = new Date(birthDate)

  if (isNaN(date.getTime())) return "" // проверка: является ли дата валидной

  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const m = today.getMonth() - date.getMonth()

  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--
  }

  return age.toString()
}
