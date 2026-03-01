// utils/audioPlayback.ts
let audioContext: AudioContext | null = null
let remoteAudioEl: HTMLAudioElement | null = null
let sourceNode: MediaStreamAudioSourceNode | null = null

export function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext({ sampleRate: 48000 })
  }
  return audioContext
}

export function playRemoteStream(stream: MediaStream | null) {
  // Чистим предыдущее
  if (remoteAudioEl) {
    remoteAudioEl.srcObject = null
    remoteAudioEl.pause()
    remoteAudioEl = null
  }
  if (sourceNode) {
    sourceNode.disconnect()
    sourceNode = null
  }

  if (!stream) return

  const ctx = getAudioContext()
  if (ctx.state === "suspended") ctx.resume()

  // Реальный вывод в динамики — через <audio> (ОС видит этот поток → AEC работает)
  const audio = new Audio()
  audio.srcObject = stream
  audio.play().catch(() => {})
  remoteAudioEl = audio

  // Регистрируем в том же AudioContext что будет использоваться для getUserMedia
  // НЕ подключаем к destination — иначе двойной звук
  sourceNode = ctx.createMediaStreamSource(stream)
}

export function closeAudioContext() {
  if (remoteAudioEl) {
    remoteAudioEl.srcObject = null
    remoteAudioEl.pause()
    remoteAudioEl = null
  }
  sourceNode?.disconnect()
  sourceNode = null
  audioContext?.close()
  audioContext = null
}
