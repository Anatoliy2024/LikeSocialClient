const genres: Record<string, string> = {
  drama: "Драма",
  comedy: "Комедия",
  action: "Экшен",
  thriller: "Триллер",
  fantasy: "Фантастика",
  sciFi: "Н.Фантастика",
  horror: "Ужасы",
  romance: "Романтика",
  adventure: "Приключения",
  mystery: "Мистика",
}

export const translatorGenres = (genre: string): string => {
  return genres[genre] || genre // если жанр не найден — вернуть как есть
}
