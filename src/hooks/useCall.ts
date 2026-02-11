import { useEffect, useRef, useState } from "react"
import { getSocket } from "@/lib/socket"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setIncomingCall,
  clearIncomingCall,
  acceptCall,
  startCall,
} from "@/store/slices/callSlice"
import Peer from "simple-peer"
import type { RootState } from "@/store/store"
import type { Socket } from "socket.io-client"
import type { SignalData } from "simple-peer"
type Maybe<T> = T | null

export const useCall = (userId: string | null) => {
  console.log("useCall init", userId)
  const dispatch = useAppDispatch()
  const { callerId, targetId } = useAppSelector((s: RootState) => s.call)

  // console.log("Хук создался****************")
  const [socket, setSocket] = useState<Maybe<Socket>>(null)
  const [localStreamState, setLocalStreamState] =
    useState<Maybe<MediaStream>>(null)
  const [remoteStream, setRemoteStream] = useState<Maybe<MediaStream>>(null)
  // const offerSignalRef = useRef<SignalData | null>(null)

  const peerRef = useRef<Maybe<Peer.Instance>>(null)

  const localStreamRef = useRef<Maybe<MediaStream>>(null)

  // ---- Получение микрофона ----
  const getOrCreateLocalStream = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true))
      return localStreamRef.current
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1,
      },
    })

    // Проверка
    const audioTrack = stream.getAudioTracks()[0]
    const settings = audioTrack.getSettings()
    console.log("🎤 Echo cancellation:", settings.echoCancellation) // должно быть true
    console.log("🎤 Noise suppression:", settings.noiseSuppression) // должно быть true

    stream.getAudioTracks().forEach((t) => (t.enabled = true))
    localStreamRef.current = stream
    setLocalStreamState(stream)
    return stream
  }

  // useEffect(() => {
  //   // console.log("peerRef.current****************************", peerRef.current)
  // }, [peerRef.current])
  // ---- Очистка всего ----
  const hardCleanup = () => {
    try {
      peerRef.current?.destroy()
    } catch {}
    peerRef.current = null
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
    }
    localStreamRef.current = null
    setLocalStreamState(null)
    setRemoteStream(null)
  }

  // ---- Создание Peer ----
  const createPeer = (initiator: boolean, stream: MediaStream) => {
    if (peerRef.current) return peerRef.current

    const p = new Peer({
      initiator,
      trickle: false,
      stream,
      config: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      },
    })

    p.on("stream", (remote) => {
      console.log("stream", remote)
      setRemoteStream(remote)
    })
    p.on("error", console.error)
    p.on("close", endCall)

    peerRef.current = p
    return p
  }

  // ---- Socket.io события ----
  useEffect(() => {
    if (!userId) return
    const token = localStorage.getItem("accessToken")
    if (!token) return

    const s = getSocket(token)
    s.connect()
    setSocket(s)

    s.on("call:incoming", ({ from, avatar, username }) =>
      dispatch(setIncomingCall({ callerId: from, avatar, username }))
    )

    s.on("call:accept", async ({ from }) => {
      console.log("Принял call:accept")
      const stream = await getOrCreateLocalStream()
      const peer = createPeer(true, stream)

      peer.on("signal", (signal) => {
        console.log("callee generated callStart", signal)
        console.log("from", from)
        s?.emit("call:signal", { to: from, signal })
      })
      const onConnect = () => dispatch(acceptCall())
      peer.on("connect", onConnect)

      // if (!targetId) return
      // const stream = await getOrCreateLocalStream()
      // const peer = createPeer(true, stream)
      // peer.on("signal", (signal) =>
      //   s.emit("call:signal", { to: targetId, signal })
      // )
      // dispatch(acceptCall())
    })

    const onSignal = async ({
      from,
      signal,
    }: {
      from: string
      signal: SignalData
    }) => {
      console.log("signal handled in hook instance", userId)
      console.log("peerRef.current***", peerRef.current)

      if (signal.type === "offer") {
        if (!peerRef.current) {
          console.log("Incoming offer, show accept UI")
          // dispatch(setIncomingCall({ callerId: from }))
          // offerSignalRef.current = signal

          const stream = await getOrCreateLocalStream()
          const peer = createPeer(false, stream)

          peer.on("signal", (signal) => {
            console.log("callee generated callAccept", signal)

            s?.emit("call:signal", { to: from, signal })
          })
          const onConnect = () => dispatch(acceptCall())
          peer.on("connect", onConnect)

          peer.signal(signal)
        }
      } else if (signal.type === "answer") {
        if (peerRef.current) {
          console.log("Applying answer")
          peerRef.current.signal(signal)
        }
      }
    }

    s.on("call:signal", onSignal)

    s.on("call:end", endCall)

    return () => {
      s.off("call:incoming")
      // s.off("call:accept")
      s.off("call:signal", onSignal)
      s.off("call:end")
    }
  }, [userId])
  // console.log("peerRef.current******************************", peerRef.current)
  // ---- Публичные экшены ----
  const callStart = async (toId: string, avatar: string, username: string) => {
    dispatch(startCall({ peerId: toId }))

    socket?.emit("call:start", {
      toUserId: toId,
      fromUserId: userId,
      avatar,
      username,
    })

    // const stream = await getOrCreateLocalStream()
    // const peer = createPeer(true, stream)

    // peerRef2.current = true
    // console.log(" peerRef2.current callAccept", peerRef2.current)

    // peer.on("signal", (signal) => {
    //   console.log("callee generated callStart", signal)
    //   socket?.emit("call:signal", { to: toId, signal })
    // })
    // const onConnect = () => dispatch(acceptCall())
    // peer.on("connect", onConnect)
  }

  const callAccept = async () => {
    socket?.emit("call:accept", { to: callerId })
    console.log("Нажал принять")
    // dispatch(acceptCall())

    // if (!callerId || !offerSignalRef.current) return

    // const stream = await getOrCreateLocalStream()
    // const peer = createPeer(false, stream)

    // peer.on("signal", (signal) => {
    //   console.log("callee generated callAccept", signal)

    //   socket?.emit("call:signal", { to: callerId, signal })
    // })
    // const onConnect = () => dispatch(acceptCall())
    // peer.on("connect", onConnect)

    // peer.signal(offerSignalRef.current)
  }

  const endCall = () => {
    console.trace("endCall was called from here!")
    console.log("hardCleanup called, destroying peer", peerRef.current)

    const to = callerId ?? targetId
    if (to) socket?.emit("call:end", { to })
    if (peerRef.current) {
      hardCleanup()
    }
    dispatch(clearIncomingCall())
    //удаление данных
    // offerSignalRef.current = null
  }

  // const setMuted = (muted: boolean) => {
  //   localStreamRef.current
  //     ?.getAudioTracks()
  //     .forEach((t) => (t.enabled = !muted))
  // }

  return {
    localStream: localStreamState,
    remoteStream,
    callStart,
    callAccept,
    endCall,
    // setMuted,
  }
}
