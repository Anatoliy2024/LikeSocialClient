import { useEffect, useRef, useState } from "react"
import { getSocket } from "@/lib/socket"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setIncomingCall,
  clearIncomingCall,
  acceptCall,
  startCall,
} from "@/store/slices/callSlice"
// import Peer from "simple-peer"
import type { RootState } from "@/store/store"
import type { Socket } from "socket.io-client"
// import type { SignalData } from "simple-peer"

// const RTCPeerConnectionWeb = RTCPeerConnection
// const RTCSessionDescriptionWeb = RTCSessionDescription
// const RTCIceCandidateWeb = RTCIceCandidate
// const RNMediaStreamWeb = MediaStream
type Maybe<T> = T | null

export const useCall = (userId: string | null) => {
  console.log("useCall init", userId)
  const dispatch = useAppDispatch()
  const { callerId, targetId } = useAppSelector((s: RootState) => s.call)

  const callStateRef = useRef({ callerId, targetId })
  useEffect(() => {
    callStateRef.current = { callerId, targetId }
  }, [callerId, targetId])

  // console.log("Хук создался****************")
  const [socket, setSocket] = useState<Maybe<Socket>>(null)
  const [localStreamState, setLocalStreamState] =
    useState<Maybe<MediaStream>>(null)
  const [remoteStream, setRemoteStream] = useState<Maybe<MediaStream>>(null)
  // const offerSignalRef = useRef<SignalData | null>(null)

  const pcRef = useRef<Maybe<RTCPeerConnection>>(null)

  const localStreamRef = useRef<Maybe<MediaStream>>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])

  // ---- Получение микрофона ----
  const getOrCreateLocalStream = async () => {
    console.log("getOrCreateLocalStream start")
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true))
      return localStreamRef.current
    }
    console.log("localStreamRef.current нету")

    const mediaDevices = navigator.mediaDevices
    console.log("mediaDevices after")

    const stream = await mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1,
      },
    })
    console.log("stream after")

    // stream.getAudioTracks().forEach((t) => (t.enabled = true))
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
      pcRef.current?.close()
    } catch {}
    pcRef.current = null
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
    }
    localStreamRef.current = null
    setLocalStreamState(null)
    setRemoteStream(null)
  }

  // ---- Создание Peer ----
  const createPeer = (
    initiator: boolean,
    stream: MediaStream,
    socket: Socket
  ) => {
    if (pcRef.current) return pcRef.current

    // const p = new Peer({
    //   initiator,
    //   trickle: false,
    //   stream,
    //   config: {
    //     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    //   },
    // })
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })

    // Добавляем локальные треки
    stream.getTracks().forEach((track) => pc.addTrack(track, stream))

    // Получение удалённого потока
    pc.ontrack = (event) => {
      console.log("ontrack", event.streams[0])
      setRemoteStream(event.streams[0])
    }

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("event.candidate", event.candidate)
        const to =
          callStateRef.current.callerId ?? callStateRef.current.targetId
        console.log("to*****", to)

        socket?.emit("call:signal", {
          to,
          signal: { candidate: event.candidate },
        })
      }
    }
    // pc.icecandidateerror=()=>{

    // }

    // Соединение установлено
    pc.onconnectionstatechange = () => {
      // if (pc.connectionState === "connected") {
      //   console.log("Peer connected")
      //   dispatch(acceptCall())

      // }

      if (pc.connectionState === "connected") {
        console.log("✅ Peer connected!") // Добавьте этот лог
        dispatch(acceptCall())
      } else if (pc.connectionState === "disconnected") {
        // Или failed
        console.warn("Peer disconnected or failed.") // Добавьте этот лог
        endCall()
      } else if (pc.connectionState === "failed") {
        console.log("connectionState failed")
      }
    }

    pcRef.current = pc
    return pc
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
      console.log("stream after")
      console.log("callerId, targetId", callerId, targetId)
      const pc = createPeer(true, stream, s)
      console.log("pc after")

      console.log("offer before")
      const offer = await pc.createOffer()
      console.log("offer after", offer)

      // // Добавляем кандидатов, которые пришли раньше
      // for (const c of pendingCandidatesRef.current) {
      //   try {
      //     const iceCandidate = new RTCIceCandidate(c);
      //     await pc.addIceCandidate(iceCandidate)
      //     console.log("✅ Отложенный candidate добавлен", c)
      //   } catch (e) {
      //     console.error("❌ Ошибка при добавлении отложенного candidate", e)
      //   }
      // }
      // pendingCandidatesRef.current = []

      console.log(" await pc.setLocalDescription(offer) before")
      await pc.setLocalDescription(offer)
      console.log(" await pc.setLocalDescription(offer) after")
      s.emit("call:signal", { to: from, signal: offer })

      // pc.onconnectionstatechange = () => {
      //   if (pc.connectionState === "connected") dispatch(acceptCall())
      // }

      // peer.on("signal", (signal) => {
      //   console.log("callee generated callStart", signal)
      //   console.log("from", from)
      //   s?.emit("call:signal", { to: from, signal })
      // })
      // const onConnect = () => dispatch(acceptCall())
      // peer.on("connect", onConnect)
    })

    const onSignal = async ({
      from,
      signal,
    }: {
      from: string
      signal: any
    }) => {
      console.log("signal handled in hook instance", userId)
      console.log("peerRef.current***", pcRef.current)

      if (signal.type === "offer") {
        if (!pcRef.current) {
          const stream = await getOrCreateLocalStream()
          console.log("callerId, targetId", callerId, targetId)

          const pc = createPeer(false, stream, s)
          // pc.onconnectionstatechange = () => {
          //   if (pc.connectionState === "connected") dispatch(acceptCall())
          // }
          const offerDescription = new RTCSessionDescription(signal)
          await pc.setRemoteDescription(offerDescription)

          // Добавляем кандидатов, которые пришли раньше
          for (const c of pendingCandidatesRef.current) {
            try {
              const iceCandidate = new RTCIceCandidate(c)

              await pc.addIceCandidate(iceCandidate)
              console.log("✅ Отложенный candidate добавлен", c)
            } catch (e) {
              console.error("❌ Ошибка при добавлении отложенного candidate", e)
            }
          }
          pendingCandidatesRef.current = []

          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          s.emit("call:signal", { to: from, signal: answer })

          // console.log("Incoming offer, show accept UI")

          // const stream = await getOrCreateLocalStream()
          // const peer = createPeer(false, stream)

          // peer.on("signal", (signal) => {
          //   console.log("callee generated callAccept", signal)

          //   s?.emit("call:signal", { to: from, signal })
          // })
          // const onConnect = () => dispatch(acceptCall())
          // peer.on("connect", onConnect)

          // peer.signal(signal)
        }
      } else if (signal.type === "answer") {
        if (pcRef.current) {
          // const answerDescription = new RTCSessionDescription(signal)
          // await pcRef.current.setRemoteDescription(answerDescription)

          console.log("signal", signal)
          const answerDescription = new RTCSessionDescription(signal)
          console.log("answerDescription", answerDescription)
          try {
            await pcRef.current.setRemoteDescription(answerDescription)
          } catch (err) {
            console.error(
              "ошибка await pcRef.current.setRemoteDescription(answerDescription)",
              err
            )
          }

          for (const c of pendingCandidatesRef.current) {
            try {
              const iceCandidate = new RTCIceCandidate(c)

              await pcRef.current.addIceCandidate(iceCandidate)
              console.log("✅ Отложенный candidate добавлен", c)
            } catch (e) {
              console.error("❌ Ошибка при добавлении отложенного candidate", e)
            }
          }
          pendingCandidatesRef.current = []

          // console.log("Applying answer", signal)
          // peerRef.current.signal(signal)
        }
      } else if (signal.candidate) {
        console.log("Пришел кандидат", signal.candidate)
        if (pcRef.current && pcRef.current.remoteDescription) {
          try {
            const iceCandidate = new RTCIceCandidate(signal.candidate)

            await pcRef.current.addIceCandidate(iceCandidate)
            console.log(" кандидат сразу добавлен", signal.candidate)
          } catch (e) {
            console.error("❌ Ошибка при addIceCandidate", e)
          }
        } else {
          console.log(
            "Candidate получен раньше setRemoteDescription, буферизуем"
          )
          pendingCandidatesRef.current.push(signal.candidate)
        }
      }
      // else if (signal.candidate) {
      //   if (pcRef.current) {
      //     await pcRef.current.addIceCandidate(signal.candidate)
      //   }
      // }
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
  }

  const callAccept = async () => {
    socket?.emit("call:accept", { to: callerId })
    console.log("Нажал принять")
  }

  const endCall = () => {
    console.trace("endCall was called from here!")
    console.log("hardCleanup called, destroying peer", pcRef.current)

    const to = callerId ?? targetId
    if (to) socket?.emit("call:end", { to })
    if (pcRef.current) {
      hardCleanup()
    }
    dispatch(clearIncomingCall())
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

// import { useEffect, useRef, useState } from "react"
// import { getSocket } from "@/lib/socket"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import {
//   setIncomingCall,
//   clearIncomingCall,
//   acceptCall,
//   startCall,
// } from "@/store/slices/callSlice"
// import Peer from "simple-peer"
// import type { RootState } from "@/store/store"
// import type { Socket } from "socket.io-client"
// import type { SignalData } from "simple-peer"
// type Maybe<T> = T | null

// export const useCall = (userId: string | null) => {
//   console.log("useCall init", userId)
//   const dispatch = useAppDispatch()
//   const { callerId, targetId } = useAppSelector((s: RootState) => s.call)

//   // console.log("Хук создался****************")
//   const [socket, setSocket] = useState<Maybe<Socket>>(null)
//   const [localStreamState, setLocalStreamState] =
//     useState<Maybe<MediaStream>>(null)
//   const [remoteStream, setRemoteStream] = useState<Maybe<MediaStream>>(null)
//   // const offerSignalRef = useRef<SignalData | null>(null)

//   const peerRef = useRef<Maybe<Peer.Instance>>(null)

//   const localStreamRef = useRef<Maybe<MediaStream>>(null)

//   // ---- Получение микрофона ----
//   const getOrCreateLocalStream = async () => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true))
//       return localStreamRef.current
//     }
//     const stream = await navigator.mediaDevices.getUserMedia({
//       audio: {
//         echoCancellation: true,
//         noiseSuppression: true,
//         autoGainControl: true,
//         sampleRate: 48000,
//         channelCount: 1,
//       },
//     })
//     stream.getAudioTracks().forEach((t) => (t.enabled = true))
//     localStreamRef.current = stream
//     setLocalStreamState(stream)
//     return stream
//   }

//   // useEffect(() => {
//   //   // console.log("peerRef.current****************************", peerRef.current)
//   // }, [peerRef.current])
//   // ---- Очистка всего ----
//   const hardCleanup = () => {
//     try {
//       peerRef.current?.destroy()
//     } catch {}
//     peerRef.current = null
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((t) => t.stop())
//     }
//     localStreamRef.current = null
//     setLocalStreamState(null)
//     setRemoteStream(null)
//   }

//   // ---- Создание Peer ----
//   const createPeer = (initiator: boolean, stream: MediaStream) => {
//     if (peerRef.current) return peerRef.current

//     const p = new Peer({
//       initiator,
//       trickle: false,
//       stream,
//       config: {
//         iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//       },
//     })

//     p.on("stream", (remote) => {
//       console.log("stream", remote)
//       setRemoteStream(remote)
//     })
//     p.on("error", console.error)
//     p.on("close", endCall)

//     peerRef.current = p
//     return p
//   }

//   // ---- Socket.io события ----
//   useEffect(() => {
//     if (!userId) return
//     const token = localStorage.getItem("accessToken")
//     if (!token) return

//     const s = getSocket(token)
//     s.connect()
//     setSocket(s)

//     s.on("call:incoming", ({ from, avatar, username }) =>
//       dispatch(setIncomingCall({ callerId: from, avatar, username }))
//     )

//     s.on("call:accept", async ({ from }) => {
//       console.log("Принял call:accept")
//       const stream = await getOrCreateLocalStream()
//       const peer = createPeer(true, stream)

//       peer.on("signal", (signal) => {
//         console.log("callee generated callStart", signal)
//         console.log("from", from)
//         s?.emit("call:signal", { to: from, signal })
//       })
//       const onConnect = () => dispatch(acceptCall())
//       peer.on("connect", onConnect)

//       // if (!targetId) return
//       // const stream = await getOrCreateLocalStream()
//       // const peer = createPeer(true, stream)
//       // peer.on("signal", (signal) =>
//       //   s.emit("call:signal", { to: targetId, signal })
//       // )
//       // dispatch(acceptCall())
//     })

//     const onSignal = async ({
//       from,
//       signal,
//     }: {
//       from: string
//       signal: SignalData
//     }) => {
//       console.log("signal handled in hook instance", userId)
//       console.log("peerRef.current***", peerRef.current)

//       if (signal.type === "offer") {
//         if (!peerRef.current) {
//           console.log("Incoming offer, show accept UI")
//           // dispatch(setIncomingCall({ callerId: from }))
//           // offerSignalRef.current = signal

//           const stream = await getOrCreateLocalStream()
//           const peer = createPeer(false, stream)

//           peer.on("signal", (signal) => {
//             console.log("callee generated callAccept", signal)

//             s?.emit("call:signal", { to: from, signal })
//           })
//           const onConnect = () => dispatch(acceptCall())
//           peer.on("connect", onConnect)

//           peer.signal(signal)
//         }
//       } else if (signal.type === "answer") {
//         if (peerRef.current) {
//           console.log("Applying answer", signal)
//           peerRef.current.signal(signal)
//         }
//       }
//     }

//     s.on("call:signal", onSignal)

//     s.on("call:end", endCall)

//     return () => {
//       s.off("call:incoming")
//       // s.off("call:accept")
//       s.off("call:signal", onSignal)
//       s.off("call:end")
//     }
//   }, [userId])
//   // console.log("peerRef.current******************************", peerRef.current)
//   // ---- Публичные экшены ----
//   const callStart = async (toId: string, avatar: string, username: string) => {
//     dispatch(startCall({ peerId: toId }))

//     socket?.emit("call:start", {
//       toUserId: toId,
//       fromUserId: userId,
//       avatar,
//       username,
//     })

//     // const stream = await getOrCreateLocalStream()
//     // const peer = createPeer(true, stream)

//     // peerRef2.current = true
//     // console.log(" peerRef2.current callAccept", peerRef2.current)

//     // peer.on("signal", (signal) => {
//     //   console.log("callee generated callStart", signal)
//     //   socket?.emit("call:signal", { to: toId, signal })
//     // })
//     // const onConnect = () => dispatch(acceptCall())
//     // peer.on("connect", onConnect)
//   }

//   const callAccept = async () => {
//     socket?.emit("call:accept", { to: callerId })
//     console.log("Нажал принять")
//     // dispatch(acceptCall())

//     // if (!callerId || !offerSignalRef.current) return

//     // const stream = await getOrCreateLocalStream()
//     // const peer = createPeer(false, stream)

//     // peer.on("signal", (signal) => {
//     //   console.log("callee generated callAccept", signal)

//     //   socket?.emit("call:signal", { to: callerId, signal })
//     // })
//     // const onConnect = () => dispatch(acceptCall())
//     // peer.on("connect", onConnect)

//     // peer.signal(offerSignalRef.current)
//   }

//   const endCall = () => {
//     console.trace("endCall was called from here!")
//     console.log("hardCleanup called, destroying peer", peerRef.current)

//     const to = callerId ?? targetId
//     if (to) socket?.emit("call:end", { to })
//     if (peerRef.current) {
//       hardCleanup()
//     }
//     dispatch(clearIncomingCall())
//     //удаление данных
//     // offerSignalRef.current = null
//   }

//   // const setMuted = (muted: boolean) => {
//   //   localStreamRef.current
//   //     ?.getAudioTracks()
//   //     .forEach((t) => (t.enabled = !muted))
//   // }

//   return {
//     localStream: localStreamState,
//     remoteStream,
//     callStart,
//     callAccept,
//     endCall,
//     // setMuted,
//   }
// }
