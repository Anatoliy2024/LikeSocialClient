// src/lib/webrtc/PeerConnectionManager.ts

export type IceCandidateData = RTCIceCandidateInit
export type SdpData = RTCSessionDescriptionInit

export interface PeerConnectionEvents {
  onSignal: (data: {
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
      ],
    })

    this.remoteStream = new MediaStream() // 🔹 React Native: из 'react-native-webrtc'
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // 🎵 Добавляем аудио-треки
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
      if (this.isClosed) return
      if (this.pc.connectionState === "failed") {
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

    // 🔁 Negotiation needed (только для инициатора)
    if (this.initiator) {
      // 🔹 FIX: используем это.initiator, а не config
      this.pc.onnegotiationneeded = async () => {
        await this.createAndSendOffer()
      }
    }
  }

  /**
   * Создаёт и отправляет offer (выносится в отдельный метод для повторного использования)
   */
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

  /**
   * Обработка входящего сигнала от сокета
   */
  async handleSignal(data: {
    type: "offer" | "answer" | "ice-candidate"
    payload: SdpData | IceCandidateData
  }) {
    if (this.isClosed) return

    try {
      switch (data.type) {
        case "offer": {
          await this.pc.setRemoteDescription(
            data.payload as RTCSessionDescriptionInit
          )
          // Создаём answer только если мы НЕ инициатор
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
          // Answer применяем только если мы инициатор
          if (this.initiator && this.pc.signalingState !== "stable") {
            await this.pc.setRemoteDescription(
              data.payload as RTCSessionDescriptionInit
            )
          }
          break
        }
        case "ice-candidate": {
          if (data.payload && this.pc.remoteDescription) {
            await this.pc.addIceCandidate(data.payload as RTCIceCandidateInit)
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
    this.localStream.getAudioTracks().forEach((track) => {
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

    // Останавливаем только отправленные треки, не трогаем локальный стрим (он управляется хуком)
    this.pc.getSenders().forEach((sender) => {
      sender.track?.stop()
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

  /**
   * Для отладки: получить состояние соединения
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState
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
