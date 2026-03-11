// utils/audioPlayback.ts

let audioContext: AudioContext | null = null

interface AudioChain {
  source: MediaStreamAudioSourceNode
  highpass: BiquadFilterNode
  lowpass: BiquadFilterNode
  gain: GainNode
}

const remoteAudioChains = new Map<string, AudioChain>()
const remoteAudioEls = new Map<string, HTMLAudioElement>() // Фоллбэк

export function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext({
      sampleRate: 48000,
      latencyHint: "interactive",
    })
  }
  return audioContext
}

// ---- Групповой звонок ----
export function playGroupRemoteStream(socketId: string, stream: MediaStream) {
  stopGroupRemoteStream(socketId)

  // 🔹 Проверка 1: есть ли аудиотреки в стриме?
  const audioTracks = stream.getAudioTracks()
  if (audioTracks.length === 0) {
    console.warn(`⚠️ Стрим ${socketId} не содержит аудио`)
    return
  }
  console.log(`✅ Аудиотреков в стриме ${socketId}: ${audioTracks.length}`)

  // 🔹 Проверка 2: состояние треков
  audioTracks.forEach((track, i) => {
    console.log(
      `🎤 Трек ${i}: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`,
    )
  })

  try {
    const ctx = getAudioContext()
    console.log(`🔊 AudioContext state: ${ctx.state}`)

    // 🔹 Проверка 3: пробуем resume (может требовать жеста пользователя)
    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => {
          console.log("✅ AudioContext resumed")
        })
        .catch((err) => {
          console.warn("⚠️ Не удалось resume AudioContext:", err)
        })
    }

    // 🔹 Создаём цепочку фильтров
    const source = ctx.createMediaStreamSource(stream)

    const highpass = ctx.createBiquadFilter()
    highpass.type = "highpass"
    highpass.frequency.value = 80

    const lowpass = ctx.createBiquadFilter()
    lowpass.type = "lowpass"
    lowpass.frequency.value = 4000 // ← Режет высокий писк
    lowpass.Q.value = 1.0

    const gain = ctx.createGain()
    gain.gain.value = 0.75

    // ✅ Подключаем цепочку
    source.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(gain)
    gain.connect(ctx.destination)

    remoteAudioChains.set(socketId, { source, highpass, lowpass, gain })
    console.log(`🔊 Web Audio цепочка активна для ${socketId}`)

    // 🔹 Фоллбэк: создаём <audio> на всякий случай (но не играем его)
    // Это помогает некоторым браузерам "разбудить" аудио-систему
    const audio = new Audio()
    audio.srcObject = stream
    audio.volume = 0 // ← Мутим, чтобы не дублировать звук
    remoteAudioEls.set(socketId, audio)
  } catch (err) {
    console.error(`❌ Ошибка Web Audio для ${socketId}:`, err)

    // 🔄 Фоллбэк: простой <audio>, если Web Audio не сработал
    console.warn(`⚠️ Переключаемся на фоллбэк <audio> для ${socketId}`)
    const audio = new Audio()
    audio.srcObject = stream
    audio.volume = 0.75
    audio.play().catch((e) => console.error("❌ Фоллбэк не сработал:", e))
    remoteAudioEls.set(socketId, audio)
  }
}

// ---- Очистка ----
export function stopGroupRemoteStream(socketId: string) {
  // Очищаем Web Audio цепочку
  const chain = remoteAudioChains.get(socketId)
  if (chain) {
    try {
      chain.source.disconnect()
      chain.highpass.disconnect()
      chain.lowpass.disconnect()
      chain.gain.disconnect()
    } catch (e) {
      console.log(e)
    }
    remoteAudioChains.delete(socketId)
  }

  // Очищаем фоллбэк <audio>
  const audio = remoteAudioEls.get(socketId)
  if (audio) {
    audio.srcObject = null
    audio.pause()
    remoteAudioEls.delete(socketId)
  }
}

export function stopAllGroupStreams() {
  remoteAudioChains.forEach((_, socketId) => stopGroupRemoteStream(socketId))
}

export function closeAudioContext() {
  stopAllGroupStreams()
  if (audioContext && audioContext.state !== "closed") {
    audioContext.close()
    audioContext = null
  }
}

// ---- Обычный звонок (упрощённо) ----
let singleChain: AudioChain | null = null
let singleAudioEl: HTMLAudioElement | null = null

export function playRemoteStream(stream: MediaStream | null) {
  if (singleChain) {
    singleChain.source.disconnect()
    singleChain.highpass.disconnect()
    singleChain.lowpass.disconnect()
    singleChain.gain.disconnect()
    singleChain = null
  }
  if (singleAudioEl) {
    singleAudioEl.srcObject = null
    singleAudioEl.pause()
    singleAudioEl = null
  }

  if (!stream) return

  // Пробуем Web Audio
  try {
    const ctx = getAudioContext()
    if (ctx.state === "suspended") ctx.resume()

    const source = ctx.createMediaStreamSource(stream)
    const highpass = ctx.createBiquadFilter()
    highpass.type = "highpass"
    highpass.frequency.value = 80
    const lowpass = ctx.createBiquadFilter()
    lowpass.type = "lowpass"
    lowpass.frequency.value = 4000
    lowpass.Q.value = 1.0
    const gain = ctx.createGain()
    gain.gain.value = 0.75

    source.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(gain)
    gain.connect(ctx.destination)

    singleChain = { source, highpass, lowpass, gain }
  } catch {
    // Фоллбэк
    const audio = new Audio()
    audio.srcObject = stream
    audio.volume = 0.75
    audio.play().catch(() => {})
    singleAudioEl = audio
  }
}

export function stopRemoteStream() {
  if (singleChain) {
    singleChain.source.disconnect()
    singleChain.highpass.disconnect()
    singleChain.lowpass.disconnect()
    singleChain.gain.disconnect()
    singleChain = null
  }
  if (singleAudioEl) {
    singleAudioEl.srcObject = null
    singleAudioEl.pause()
    singleAudioEl = null
  }
}

// // utils/audioPlayback.ts
// let audioContext: AudioContext | null = null

// // Для группового звонка — map по socketId
// const remoteAudioEls = new Map<string, HTMLAudioElement>()
// // const sourceNodes = new Map<string, MediaStreamAudioSourceNode>()

// // Для обычного звонка (один собеседник)
// let singleAudioEl: HTMLAudioElement | null = null
// let singleSourceNode: MediaStreamAudioSourceNode | null = null

// export function getAudioContext(): AudioContext {
//   if (!audioContext || audioContext.state === "closed") {
//     audioContext = new AudioContext({ sampleRate: 48000 })
//   }
//   return audioContext
// }

// // ---- Обычный звонок (один собеседник) ----
// export function playRemoteStream(stream: MediaStream | null) {
//   if (singleAudioEl) {
//     singleAudioEl.srcObject = null
//     singleAudioEl.pause()
//     singleAudioEl = null
//   }
//   singleSourceNode?.disconnect()
//   singleSourceNode = null

//   if (!stream) return

//   const ctx = getAudioContext()
//   if (ctx.state === "suspended") ctx.resume()

//   const audio = new Audio()
//   audio.srcObject = stream
//   audio.play().catch(() => {})
//   singleAudioEl = audio

//   singleSourceNode = ctx.createMediaStreamSource(stream)
// }

// // ---- Групповой звонок (несколько участников) ----
// export function playGroupRemoteStream(socketId: string, stream: MediaStream) {
//   // Убираем предыдущий если был
//   stopGroupRemoteStream(socketId)

//   const ctx = getAudioContext()
//   if (ctx.state === "suspended") ctx.resume()

//   const audio = new Audio()
//   audio.srcObject = stream
//   audio.volume = 0.75
//   audio.play().catch(() => {})
//   remoteAudioEls.set(socketId, audio)

//   // const node = ctx.createMediaStreamSource(stream)
//   // sourceNodes.set(socketId, node)
// }

// export function stopGroupRemoteStream(socketId: string) {
//   const audio = remoteAudioEls.get(socketId)
//   if (audio) {
//     audio.srcObject = null
//     audio.pause()
//     remoteAudioEls.delete(socketId)
//   }
//   // sourceNodes.get(socketId)?.disconnect()
//   // sourceNodes.delete(socketId)
// }

// export function stopAllGroupStreams() {
//   remoteAudioEls.forEach((audio) => {
//     audio.srcObject = null
//     audio.pause()
//   })
//   remoteAudioEls.clear()
//   // sourceNodes.forEach((node) => node.disconnect())
//   // sourceNodes.clear()
// }

// export function closeAudioContext() {
//   singleAudioEl?.pause()
//   singleAudioEl = null
//   singleSourceNode?.disconnect()
//   singleSourceNode = null
//   stopAllGroupStreams()
//   audioContext?.close()
//   audioContext = null
// }
