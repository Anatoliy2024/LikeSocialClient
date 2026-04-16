export const POST_TYPES = {
  movie: {
    label: "Фильм",
    ratings: {
      stars: { label: "Общая оценка", min: 0, max: 5 },
      acting: { label: "Актёрская игра", min: 0, max: 5 },
      story: { label: "Сюжет", min: 0, max: 5 },
      specialEffects: { label: "Спецэффекты", min: 0, max: 5 },
    },
  },
  episode: {
    label: "Серия",
    ratings: {
      stars: { label: "Общая оценка", min: 0, max: 5 },
      acting: { label: "Актёрская игра", min: 0, max: 5 },
      story: { label: "Сюжет", min: 0, max: 5 },
    },
  },
  letsplay: {
    label: "Летсплей",
    ratings: {
      gameplay: { label: "Геймплей", min: 0, max: 5 },
      commentary: { label: "Комментарий", min: 0, max: 5 },
      story: { label: "Сюжет", min: 0, max: 5 },
    },
  },
  history: {
    label: "История",
    ratings: {
      storytelling: { label: "Подача", min: 0, max: 5 },
      story: { label: "Сюжет", min: 0, max: 5 },
      charisma: { label: "Харизма", min: 0, max: 5 },
    },
  },
  classic: {
    label: "Пост",
    ratings: {},
  },
} as const

export type PostTypeKey = keyof typeof POST_TYPES

// 🔥 Авто-извлечение всех возможных ключей рейтингов
export type AllRatingKeys = {
  [T in PostTypeKey]: keyof (typeof POST_TYPES)[T]["ratings"]
}[PostTypeKey]
