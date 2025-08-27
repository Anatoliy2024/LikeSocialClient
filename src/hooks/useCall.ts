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
  const dispatch = useAppDispatch()
  const { callerId, targetId } = useAppSelector((s: RootState) => s.call)

  const [socket, setSocket] = useState<Maybe<Socket>>(null)
  const [localStreamState, setLocalStreamState] =
    useState<Maybe<MediaStream>>(null)
  const [remoteStream, setRemoteStream] = useState<Maybe<MediaStream>>(null)
  const offerSignalRef = useRef<SignalData | null>(null)

  const peerRef = useRef<Maybe<Peer.Instance>>(null)
  const localStreamRef = useRef<Maybe<MediaStream>>(null)

  // ---- Получение микрофона ----
  const getOrCreateLocalStream = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true))
      return localStreamRef.current
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getAudioTracks().forEach((t) => (t.enabled = true))
    localStreamRef.current = stream
    setLocalStreamState(stream)
    return stream
  }

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

    const p = new Peer({ initiator, trickle: false, stream })

    p.on("stream", (remote) => setRemoteStream(remote))
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

    // s.on("call:incoming", ({ from }) =>
    //   dispatch(setIncomingCall({ callerId: from }))
    // )

    // s.on("call:accept", async ({ from }) => {
    //   if (!targetId) return
    //   const stream = await getOrCreateLocalStream()
    //   const peer = createPeer(true, stream)
    //   peer.on("signal", (signal) =>
    //     s.emit("call:signal", { to: targetId, signal })
    //   )
    //   dispatch(acceptCall())
    // })

    s.on("call:signal", async ({ from, signal }) => {
      console.log("peerRef.current", peerRef.current)
      // if (!peerRef.current) {
      //   console.log("setIncomingCall")
      //   dispatch(setIncomingCall({ callerId: from }))
      //   offerSignalRef.current = signal
      //   // setOfferSignal(signal)
      //   // const stream = await getOrCreateLocalStream()
      //   // const peer = createPeer(false, stream)
      //   // peer.on("signal", (sdp) =>
      //   //   s.emit("call:signal", { to: from, signal: sdp })
      //   // )
      //   // peer.signal(signal)
      // } else {
      //   console.log("signal", signal)

      //   peerRef.current.signal(signal)
      //   dispatch(acceptCall())
      // }
      console.log("signal received", signal)

      if (signal.type === "offer") {
        if (!peerRef.current) {
          console.log("Incoming offer, show accept UI")
          dispatch(setIncomingCall({ callerId: from }))
          offerSignalRef.current = signal
        }
      } else if (signal.type === "answer") {
        if (peerRef.current) {
          console.log("Applying answer")
          peerRef.current.signal(signal)
          dispatch(acceptCall())
        }
      }
      // else if (signal.candidate) {
      //   // если бы trickle:true
      //   peerRef.current?.signal(signal)
      // }
    })

    s.on("call:end", endCall)

    return () => {
      // s.off("call:incoming")
      // s.off("call:accept")
      s.off("call:signal")
      s.off("call:end")
    }
  }, [userId])

  // ---- Публичные экшены ----
  const callStart = async (toId: string) => {
    dispatch(startCall({ peerId: toId }))
    const stream = await getOrCreateLocalStream()
    const peer = createPeer(true, stream)
    peer.on("signal", (signal) =>
      socket?.emit("call:signal", { to: toId, signal })
    )
    // socket?.emit("call:start", { toUserId: toId, fromUserId: userId })
  }

  const callAccept = async () => {
    if (!callerId) return
    const stream = await getOrCreateLocalStream()
    const peer = createPeer(false, stream)

    peer.on("signal", (signal) =>
      socket?.emit("call:signal", { to: callerId, signal })
    )
    // console.log("offerSignalRef.current", offerSignalRef.current)
    if (offerSignalRef.current) {
      peer.signal(offerSignalRef.current)
    }
    offerSignalRef.current = null
    dispatch(acceptCall())

    //
    // socket?.emit("call:accept", { toUserId: callerId })
  }

  const endCall = () => {
    const to = callerId ?? targetId
    if (to) socket?.emit("call:end", { to })
    hardCleanup()
    dispatch(clearIncomingCall())
    //удаление данных
    offerSignalRef.current = null

    // setOfferSignal(null)
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
