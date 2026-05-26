// // Вынеси эту функцию за компонент или в utils
// export const calculateSeedingDelay = (fileSizeBytes: number): number => {
//   const GB = 1024 * 1024 * 1024

//   if (fileSizeBytes < 1 * GB) return 8000 // < 1 ГБ → 8 сек
//   if (fileSizeBytes < 4 * GB) return 15000 // 1-4 ГБ → 15 сек
//   if (fileSizeBytes < 8 * GB) return 25000 // 4-8 ГБ → 25 сек
//   return 40000 // > 8 ГБ → 40 сек
// }
export const calculateSeedingDelay = (fileSizeBytes: number): number => {
  const MIN_DELAY = 5000 // минимум 5 сек
  const MAX_DELAY = 45000 // максимум 45 сек
  const BYTES_PER_SEC = 100 * 1024 * 1024 // ~100 МБ/сек условной "стабилизации"

  const calculated = Math.min(
    MAX_DELAY,
    Math.max(MIN_DELAY, (fileSizeBytes / BYTES_PER_SEC) * 1000),
  )

  return Math.round(calculated / 1000) * 1000 // округляем до секунд
}
