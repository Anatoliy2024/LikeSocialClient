const URL_REGEX = /https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/gi

export const parseMessage = (text: string) => {
  const parts = []
  let lastIndex = 0
  let match

  URL_REGEX.lastIndex = 0 // сброс для глобального флага

  while ((match = URL_REGEX.exec(text)) !== null) {
    // текст до ссылки
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const url = match[0]
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "#0062c4", textDecoration: "underline" }}
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>,
    )

    lastIndex = URL_REGEX.lastIndex
  }

  // остаток текста после последней ссылки
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}
