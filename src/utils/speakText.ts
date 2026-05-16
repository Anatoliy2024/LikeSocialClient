export const speakText = (text: string | null) => {
  if (!text) return

  const utterance = new SpeechSynthesisUtterance(text)

  // const voice = voices.find((v) => v.name === voiceName)

  // if (voice) {
  //   utterance.voice = voice
  // }

  utterance.lang = "ru-RU"
  utterance.rate = 1
  utterance.pitch = 1

  speechSynthesis.speak(utterance)
}
