// utils/audioPlayback.ts
let audioContext: AudioContext | null = null

// Для группового звонка — map по socketId
const remoteAudioEls = new Map<string, HTMLAudioElement>()
const sourceNodes = new Map<string, MediaStreamAudioSourceNode>()

// Для обычного звонка (один собеседник)
let singleAudioEl: HTMLAudioElement | null = null
let singleSourceNode: MediaStreamAudioSourceNode | null = null

export function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext({ sampleRate: 48000 })
  }
  return audioContext
}

// ---- Обычный звонок (один собеседник) ----
export function playRemoteStream(stream: MediaStream | null) {
  if (singleAudioEl) {
    singleAudioEl.srcObject = null
    singleAudioEl.pause()
    singleAudioEl = null
  }
  singleSourceNode?.disconnect()
  singleSourceNode = null

  if (!stream) return

  const ctx = getAudioContext()
  if (ctx.state === "suspended") ctx.resume()

  const audio = new Audio()
  audio.srcObject = stream
  audio.play().catch(() => {})
  singleAudioEl = audio

  singleSourceNode = ctx.createMediaStreamSource(stream)
}

// ---- Групповой звонок (несколько участников) ----
export function playGroupRemoteStream(socketId: string, stream: MediaStream) {
  // Убираем предыдущий если был
  stopGroupRemoteStream(socketId)

  const ctx = getAudioContext()
  if (ctx.state === "suspended") ctx.resume()

  const audio = new Audio()
  audio.srcObject = stream
  audio.play().catch(() => {})
  remoteAudioEls.set(socketId, audio)

  const node = ctx.createMediaStreamSource(stream)
  sourceNodes.set(socketId, node)
}

export function stopGroupRemoteStream(socketId: string) {
  const audio = remoteAudioEls.get(socketId)
  if (audio) {
    audio.srcObject = null
    audio.pause()
    remoteAudioEls.delete(socketId)
  }
  sourceNodes.get(socketId)?.disconnect()
  sourceNodes.delete(socketId)
}

export function stopAllGroupStreams() {
  remoteAudioEls.forEach((audio) => {
    audio.srcObject = null
    audio.pause()
  })
  remoteAudioEls.clear()
  sourceNodes.forEach((node) => node.disconnect())
  sourceNodes.clear()
}

export function closeAudioContext() {
  singleAudioEl?.pause()
  singleAudioEl = null
  singleSourceNode?.disconnect()
  singleSourceNode = null
  stopAllGroupStreams()
  audioContext?.close()
  audioContext = null
}

// // utils/audioPlayback.ts
// let audioContext: AudioContext | null = null
// let remoteAudioEl: HTMLAudioElement | null = null
// let sourceNode: MediaStreamAudioSourceNode | null = null

// export function getAudioContext(): AudioContext {
//   if (!audioContext || audioContext.state === "closed") {
//     audioContext = new AudioContext({ sampleRate: 48000 })
//   }
//   return audioContext
// }

// export function playRemoteStream(stream: MediaStream | null) {
//   // Чистим предыдущее
//   if (remoteAudioEl) {
//     remoteAudioEl.srcObject = null
//     remoteAudioEl.pause()
//     remoteAudioEl = null
//   }
//   if (sourceNode) {
//     sourceNode.disconnect()
//     sourceNode = null
//   }

//   if (!stream) return

//   const ctx = getAudioContext()
//   if (ctx.state === "suspended") ctx.resume()

//   // Реальный вывод в динамики — через <audio> (ОС видит этот поток → AEC работает)
//   const audio = new Audio()
//   audio.srcObject = stream
//   audio.play().catch(() => {})
//   remoteAudioEl = audio

//   // Регистрируем в том же AudioContext что будет использоваться для getUserMedia
//   // НЕ подключаем к destination — иначе двойной звук
//   sourceNode = ctx.createMediaStreamSource(stream)
// }

// export function closeAudioContext() {
//   if (remoteAudioEl) {
//     remoteAudioEl.srcObject = null
//     remoteAudioEl.pause()
//     remoteAudioEl = null
//   }
//   sourceNode?.disconnect()
//   sourceNode = null
//   audioContext?.close()
//   audioContext = null
// }
