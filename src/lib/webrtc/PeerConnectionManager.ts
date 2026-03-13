// src/lib/webrtc/PeerConnectionManager.ts

export type IceCandidateData = RTCIceCandidateInit
export type SdpData = RTCSessionDescriptionInit

export interface PeerConnectionEvents {
  onSignal: (data: {
    type: "offer" | "answer" | "ice-candidate"
    payload: SdpData | IceCandidateData
  }) => void
  onStream: (stream: MediaStream) => void
  onConnected?: () => void
  onError: (error: Error) => void
  onClose: () => void
}

export interface PeerConnectionConfig {
  initiator: boolean
  remoteUserId: string
  remoteSocketId: string
  localStream: MediaStream
  iceServers?: RTCIceServer[]
  events: PeerConnectionEvents
}

/**
 * Класс-обёртка над нативным RTCPeerConnection.
 *
 * 🔹 Web: работает из коробки
 * 🔹 React Native: заменить импорты на 'react-native-webrtc' (см. комментарии)
 */
export class PeerConnectionManager {
  private pc: RTCPeerConnection
  private remoteStream: MediaStream
  private localStream: MediaStream
  private readonly remoteSocketId: string
  private readonly remoteUserId: string
  private readonly events: PeerConnectionEvents
  private readonly initiator: boolean // 🔹 FIX: сохраняем как свойство класса
  private isClosed = false
  private isNegotiating = false // 🔹 Защита от параллельных renegotiate
  private pendingRenegotiation = false
  private iceCandidateBuffer: RTCIceCandidateInit[] = []
  private isBufferApplied = false // ← Новый флаг

  constructor(config: PeerConnectionConfig) {
    this.remoteSocketId = config.remoteSocketId
    this.remoteUserId = config.remoteUserId
    this.localStream = config.localStream
    this.events = config.events
    this.initiator = config.initiator // 🔹 FIX: сохраняем

    // 🔹 React Native: заменить на импорт из 'react-native-webrtc'
    this.pc = new RTCPeerConnection({
      iceServers: config.iceServers || [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }, // Опционально
      ],
    })

    this.remoteStream = new MediaStream() // 🔹 React Native: из 'react-native-webrtc'
    this.setupEventListeners()
  }
  // 🔹 2. Метод для применения буфера (переиспользуемый)
  private async applyIceCandidateBuffer() {
    if (this.isBufferApplied || this.iceCandidateBuffer.length === 0) return

    console.log(
      `📦 Applying ${this.iceCandidateBuffer.length} buffered ICE candidates`,
    )

    for (const candidate of this.iceCandidateBuffer) {
      try {
        await this.pc.addIceCandidate(candidate)
      } catch (err) {
        console.warn("⚠️ Failed to add buffered candidate:", err)
      }
    }

    this.iceCandidateBuffer = []
    this.isBufferApplied = true
  }

  private setupEventListeners() {
    // 🎵 Добавляем аудио-треки (всегда при создании)
    this.localStream.getAudioTracks().forEach((track) => {
      this.pc.addTrack(track, this.localStream)
    })

    // 📥 Приём удалённого стрима
    this.pc.ontrack = (event) => {
      if (event.streams?.[0]) {
        this.remoteStream = event.streams[0]
        this.events.onStream(this.remoteStream)
      }
    }

    // 📡 ICE кандидат
    this.pc.onicecandidate = (event) => {
      if (event.candidate && !this.isClosed) {
        this.events.onSignal({
          type: "ice-candidate",
          payload: event.candidate.toJSON(),
        })
      }
    }

    // ❌ Ошибки соединения
    this.pc.onconnectionstatechange = () => {
      console.log(
        `🔌 [PC] connectionState [${this.remoteSocketId}]:`,
        this.pc.connectionState,
      )
      console.log(
        `❄️ [PC] iceConnectionState [${this.remoteSocketId}]:`,
        this.pc.iceConnectionState,
      )
      console.log(
        `📡 [PC] signalingState [${this.remoteSocketId}]:`,
        this.pc.signalingState,
      )
      if (this.isClosed) return
      console.log(
        `🔌 connectionState [${this.remoteSocketId}]:`,
        this.pc.connectionState,
      )

      if (this.pc.connectionState === "connected") {
        console.log("✅ Connection established")
        this.events.onConnected?.()
      }
      if (this.pc.connectionState === "failed") {
        console.error("❌ [PC] Connection failed")
        this.events.onError(new Error("Connection failed"))
      }
    }

    // 🚪 Закрытие
    this.pc.oniceconnectionstatechange = () => {
      if (this.isClosed) return
      if (
        this.pc.iceConnectionState === "closed" ||
        this.pc.iceConnectionState === "failed"
      ) {
        this.close()
      }
    }

    // 🔁 Negotiation needed (только для инициатора, ТОЛЬКО для начального соединения)
    if (this.initiator) {
      this.pc.onnegotiationneeded = async () => {
        // 🔹 Пропускаем, если уже есть удалённое описание (ренеготация)
        if (!this.pc.remoteDescription) {
          await this.createAndSendOffer()
        }
      }
    }
  }
  /**
   * Создаёт и отправляет offer
   */
  private async createAndSendOffer() {
    if (this.isClosed || this.isNegotiating) return
    if (this.pc.signalingState !== "stable") return

    this.isNegotiating = true
    try {
      const offer = await this.pc.createOffer()
      if (this.pc.signalingState !== "stable") return

      await this.pc.setLocalDescription(offer)
      this.events.onSignal({
        type: "offer",
        payload: this.pc.localDescription!,
      })
    } catch (err) {
      this.events.onError(
        err instanceof Error ? err : new Error("Create offer failed"),
      )
    } finally {
      this.isNegotiating = false
    }
  }

  // /**
  //  * 🔹 НОВЫЙ МЕТОД: Запуск ренеготации для добавления видео
  //  * Вызывай этот метод из useCall/useGroupCall при toggleVideo
  //  */
  // async renegotiateForVideo() {
  //   if (this.isClosed || this.isNegotiating) return
  //   if (this.pc.signalingState !== "stable") return

  //   this.isNegotiating = true
  //   try {
  //     const offer = await this.pc.createOffer({
  //       offerToReceiveAudio: true,
  //       offerToReceiveVideo: true, // ← Важно для видео
  //     })
  //     if (this.pc.signalingState !== "stable") return

  //     await this.pc.setLocalDescription(offer)
  //     this.events.onSignal({
  //       type: "offer",
  //       payload: this.pc.localDescription!,
  //     })
  //     console.log("🎥 Renegotiation offer sent for video")
  //   } catch (err) {
  //     console.error("❌ Renegotiation failed:", err)
  //   } finally {
  //     this.isNegotiating = false
  //   }
  // }
  /**
   * 🔹 Ренеготация для добавления/удаления видео
   * С защитой от гонок и очередью
   */
  async renegotiateForVideo() {
    // 🔹 Защита от повторных вызовов
    if (this.isClosed || this.isNegotiating) {
      console.log("⏳ Renegotiation already in progress, queued")
      this.pendingRenegotiation = true
      return
    }

    // 🔹 Ждём стабильного состояния
    if (this.pc.signalingState !== "stable") {
      console.log(
        `⏳ Waiting for stable signaling state: ${this.pc.signalingState}`,
      )
      this.pendingRenegotiation = true
      return
    }

    this.isNegotiating = true
    this.pendingRenegotiation = false

    try {
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })

      // 🔹 Двойная проверка после await
      if (this.isClosed || this.pc.signalingState !== "stable") {
        console.warn(
          "⚠️ Signaling state changed during renegotiation, aborting",
        )
        return
      }

      await this.pc.setLocalDescription(offer)

      this.events.onSignal({
        type: "offer",
        payload: this.pc.localDescription!,
      })

      console.log("🎥 Renegotiation offer sent")
    } catch (err) {
      console.error("❌ Renegotiation failed:", err)
      this.events.onError(
        err instanceof Error ? err : new Error("Renegotiation failed"),
      )
    } finally {
      this.isNegotiating = false

      // 🔹 Если пока ждали, пришла ещё одна ренеготация — выполняем её
      if (
        this.pendingRenegotiation &&
        !this.isClosed &&
        this.pc.signalingState === "stable"
      ) {
        console.log("🔄 Processing queued renegotiation")
        this.pendingRenegotiation = false
        // Рекурсивный вызов, но с защитой от бесконечного цикла
        setTimeout(() => this.renegotiateForVideo(), 100)
      }
    }
  }

  /**
   * Обработка входящего сигнала
   */
  async handleSignal(data: {
    type: "offer" | "answer" | "ice-candidate"
    payload: SdpData | IceCandidateData
  }) {
    if (this.isClosed) return

    try {
      switch (data.type) {
        case "offer": {
          // Glare handling: если у нас уже есть локальный offer — откатываемся
          if (this.pc.signalingState === "have-local-offer") {
            await this.pc.setLocalDescription({ type: "rollback" })
          }

          await this.pc.setRemoteDescription(
            data.payload as RTCSessionDescriptionInit,
          )
          await this.applyIceCandidateBuffer()
          // // Применяем буферизованные ICE кандидаты
          // if (this.iceCandidateBuffer.length > 0) {
          //   console.log(
          //     `📦 Applying ${this.iceCandidateBuffer.length} buffered ICE candidates`,
          //   )
          //   for (const candidate of this.iceCandidateBuffer) {
          //     await this.pc.addIceCandidate(candidate)
          //   }
          //   this.iceCandidateBuffer = []
          // }

          // 🔹 Создаём answer ТОЛЬКО если мы НЕ инициатор (для начального соединения)
          // Но для ренеготации — создаём всегда, если получили offer
          if (!this.initiator || this.pc.remoteDescription) {
            const answer = await this.pc.createAnswer()
            await this.pc.setLocalDescription(answer)
            this.events.onSignal({
              type: "answer",
              payload: this.pc.localDescription!,
            })
          }
          break
        }

        case "answer": {
          // 🔹 Answer применяем, если мы инициатор ИЛИ если это ренеготация
          if (this.initiator || this.pc.signalingState === "have-local-offer") {
            if (this.pc.signalingState === "have-local-offer") {
              await this.pc.setRemoteDescription(
                data.payload as RTCSessionDescriptionInit,
              )
              await this.applyIceCandidateBuffer()
              // if (this.iceCandidateBuffer.length > 0) {
              //   for (const candidate of this.iceCandidateBuffer) {
              //     await this.pc.addIceCandidate(candidate)
              //   }
              //   this.iceCandidateBuffer = []
              // }
            }
          }
          break
        }

        case "ice-candidate": {
          if (!data.payload) break

          const candidate = data.payload as RTCIceCandidateInit
          // console.log(
          //   `❄️ [ICE] Candidate: type=${candidate.type}, candidate=${candidate.candidate?.slice(0, 50)}...`,
          // )
          if (this.pc.remoteDescription) {
            // await this.pc.addIceCandidate(data.payload as RTCIceCandidateInit)
            await this.pc
              .addIceCandidate(candidate)
              .catch((err) =>
                console.warn("⚠️ Failed to add ICE candidate:", err),
              )
          } else {
            console.log("📦 Buffering ICE candidate")
            this.iceCandidateBuffer.push(candidate)
          }
          break
        }
      }
    } catch (err) {
      console.error(`[PeerConnectionManager] Signal error (${data.type}):`, err)
      this.events.onError(
        err instanceof Error ? err : new Error("Signal handling failed"),
      )
    }
  }

  getRemoteStream(): MediaStream {
    return this.remoteStream
  }

  toggleLocalAudio(enabled: boolean) {
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled
    })
  }

  close(silent = false) {
    if (this.isClosed) return
    this.isClosed = true

    this.pc.ontrack = null
    this.pc.onicecandidate = null
    this.pc.onconnectionstatechange = null
    this.pc.oniceconnectionstatechange = null
    this.pc.onnegotiationneeded = null
    this.iceCandidateBuffer = []
    this.isBufferApplied = false

    // // Останавливаем только отправленные треки, не трогаем локальный стрим (он управляется хуком)
    // this.pc.getSenders().forEach((sender) => {
    //   sender.track?.stop()
    // })

    this.pc.close()
    // Не триггерим onClose если закрываем намеренно (silent = true)
    if (!silent) {
      this.events.onClose()
    }
    // this.events.onClose()
  }

  getRemoteSocketId(): string {
    return this.remoteSocketId
  }

  getRemoteUserId(): string {
    return this.remoteUserId
  }

  /**
   * Для отладки: получить состояние соединения
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState
  }
  getPeerConnection(): RTCPeerConnection {
    return this.pc
  }

  addVideoTrack(track: MediaStreamTrack, stream: MediaStream) {
    this.pc.addTrack(track, stream)
  }
  getIsClosed(): boolean {
    return (
      this.pc.connectionState === "closed" ||
      this.pc.connectionState === "failed"
    )
  }
}

// ============================================================================
// 📱 ВЕРСИЯ ДЛЯ REACT NATIVE (ЗАКОММЕНТИРОВАНА — РАСКОММЕНТИРУЙ ПРИ НУЖДЕ)
// ============================================================================
// Чтобы использовать эту версию:
// 1. Установи: npm install react-native-webrtc
// 2. Настрой по инструкции: https://github.com/react-native-webrtc/react-native-webrtc
// 3. Закомментируй ВЕСЬ ВЕРХНИЙ БЛОК (веб-версию)
// 4. Раскомментируй ЭТОТ БЛОК (начиная со строки ~265)

/*
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
} from 'react-native-webrtc'

export type IceCandidateData = any
export type SdpData = any

export interface PeerConnectionEvents {
  onSignal: ( {
    type: "offer" | "answer" | "ice-candidate"
    payload: SdpData | IceCandidateData
  }) => void
  onStream: (stream: MediaStream) => void
  onError: (error: Error) => void
  onClose: () => void
}

export interface PeerConnectionConfig {
  initiator: boolean
  remoteUserId: string
  remoteSocketId: string
  localStream: MediaStream
  iceServers?: RTCIceServer[]
  events: PeerConnectionEvents
}

export class PeerConnectionManager {
  private pc: RTCPeerConnection
  private remoteStream: MediaStream
  private localStream: MediaStream
  private readonly remoteSocketId: string
  private readonly remoteUserId: string
  private readonly events: PeerConnectionEvents
  private readonly initiator: boolean
  private isClosed = false
  private isNegotiating = false

  constructor(config: PeerConnectionConfig) {
    this.remoteSocketId = config.remoteSocketId
    this.remoteUserId = config.remoteUserId
    this.localStream = config.localStream
    this.events = config.events
    this.initiator = config.initiator

    this.pc = new RTCPeerConnection({
      iceServers: config.iceServers || [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      bundlePolicy: 'max-bundle',
    })

    this.remoteStream = new MediaStream()
    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
      this.pc.addTrack(track, this.localStream)
    })

    this.pc.ontrack = (event) => {
      if (event.streams?.[0]) {
        this.remoteStream = event.streams[0]
        this.events.onStream(this.remoteStream)
      }
    }

    this.pc.onicecandidate = (event) => {
      if (event.candidate && !this.isClosed) {
        this.events.onSignal({
          type: "ice-candidate",
          payload: event.candidate.toJSON(),
        })
      }
    }

    this.pc.onconnectionstatechange = () => {
      if (this.isClosed) return
      if (this.pc.connectionState === "failed") {
        this.events.onError(new Error("Connection failed"))
      }
    }

    this.pc.oniceconnectionstatechange = () => {
      if (this.isClosed) return
      if (
        this.pc.iceConnectionState === "closed" ||
        this.pc.iceConnectionState === "failed"
      ) {
        this.close()
      }
    }

    if (this.initiator) {
      this.pc.onnegotiationneeded = async () => {
        await this.createAndSendOffer()
      }
    }
  }

  private async createAndSendOffer() {
    if (this.isClosed || this.isNegotiating) return
    this.isNegotiating = true

    try {
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      })
      await this.pc.setLocalDescription(offer)
      this.events.onSignal({
        type: "offer",
        payload: this.pc.localDescription!,
      })
    } catch (err) {
      this.events.onError(
        err instanceof Error ? err : new Error("Create offer failed")
      )
    } finally {
      this.isNegotiating = false
    }
  }

  async handleSignal( {
    type: "offer" | "answer" | "ice-candidate"
    payload: SdpData | IceCandidateData
  }) {
    if (this.isClosed) return

    try {
      switch (data.type) {
        case "offer": {
          await this.pc.setRemoteDescription(data.payload as any)
          if (!this.initiator) {
            const answer = await this.pc.createAnswer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: false,
            })
            await this.pc.setLocalDescription(answer)
            this.events.onSignal({
              type: "answer",
              payload: this.pc.localDescription!,
            })
          }
          break
        }
        case "answer": {
          if (this.initiator && this.pc.signalingState !== "stable") {
            await this.pc.setRemoteDescription(data.payload as any)
          }
          break
        }
        case "ice-candidate": {
          if (data.payload && this.pc.remoteDescription) {
            await this.pc.addIceCandidate(data.payload as any)
          }
          break
        }
      }
    } catch (err) {
      console.error(`[PeerConnectionManager] Signal error (${data.type}):`, err)
      this.events.onError(
        err instanceof Error ? err : new Error("Signal handling failed")
      )
    }
  }

  getRemoteStream(): MediaStream {
    return this.remoteStream
  }

  toggleLocalAudio(enabled: boolean) {
    this.localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = enabled
    })
  }

  close() {
    if (this.isClosed) return
    this.isClosed = true

    this.pc.ontrack = null
    this.pc.onicecandidate = null
    this.pc.onconnectionstatechange = null
    this.pc.onnegotiationneeded = null

    this.pc.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop()
      }
    })

    this.pc.close()
    this.events.onClose()
  }

  getRemoteSocketId(): string {
    return this.remoteSocketId
  }

  getRemoteUserId(): string {
    return this.remoteUserId
  }

  getConnectionState() {
    return this.pc.connectionState
  }

  static isWebRTCSupported(): boolean {
    try {
      return typeof RTCPeerConnection !== "undefined"
    } catch {
      return false
    }
  }
}
*/
