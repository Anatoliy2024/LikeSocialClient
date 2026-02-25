export const REACTIONS = [
  { id: "like", emoji: "👍", label: "Нравится" },
  { id: "love", emoji: "❤️", label: "Любовь" },
  { id: "laugh", emoji: "😂", label: "Смешно" },
  { id: "wow", emoji: "😮", label: "Вау" },
  { id: "sad", emoji: "😢", label: "Грустно" },
  { id: "angry", emoji: "😡", label: "Злость" },
  { id: "fire", emoji: "🔥", label: "Огонь" },
  { id: "clap", emoji: "👏", label: "Аплодисменты" },
  { id: "cry", emoji: "😭", label: "Плачу" },
  { id: "think", emoji: "🤔", label: "Думаю" },
  { id: "shock", emoji: "😱", label: "Шок" },
  { id: "100", emoji: "💯", label: "Сотка" },
  { id: "party", emoji: "🎉", label: "Праздник" },
  { id: "eyes", emoji: "👀", label: "Смотрю" },
  { id: "pray", emoji: "🙏", label: "Пожалуйста" },
  { id: "muscle", emoji: "💪", label: "Сила" },
  { id: "facepalm", emoji: "🤦", label: "Фейспалм" },
  { id: "dislike", emoji: "👎", label: "Не нравится" },
  { id: "ok", emoji: "👌", label: "Окей" },
  { id: "rocket", emoji: "🚀", label: "Ракета" },
] as const

export type EmojiId = (typeof REACTIONS)[number]["id"]
