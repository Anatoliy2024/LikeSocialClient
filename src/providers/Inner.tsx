// "use client"
// import { useEffect, useRef, useState } from "react"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { getStatusServerThunk } from "@/store/thunks/serverThunk"
// import Navbar from "@/components/navbar/Navbar"
// import HeaderContainer from "@/components/header/HeaderContainer"
// import AuthProvider from "./AuthProvider"
// import { ServerType } from "@/store/slices/serverSlice"
// import { useTikServer } from "@/utils/useTikServer"
// import { getSocket } from "@/lib/socket"

// import style from "@/components/navbar/navbar.module.scss"
// import { RootState } from "@/store/store"
// import {
//   setOnlineStatusList,
//   updateUserStatus,
// } from "@/store/slices/onlineStatusSlice"
// import { addNotification } from "@/store/slices/notificationsSlice"
// import { Loading } from "@/assets/loading/loading"
// import {
//   acceptCall,
//   endCall,
//   incomingCall,
//   startOutgoingCall,
// } from "@/store/slices/callSlice"
// import { Socket } from "socket.io-client"

// let peerConnection: RTCPeerConnection | null = null

// export default function InnerApp({ children }: { children: React.ReactNode }) {
//   const [menuOpen, setMenuOpen] = useState(false)
//   const [showButton, setShowButton] = useState(false)
//   const [socket, setSocket] = useState<Socket | null>(null)

//   const navRef = useRef<HTMLDivElement | null>(null)
//   const localAudioRef = useRef<HTMLAudioElement>(null)
//   const remoteAudioRef = useRef<HTMLAudioElement>(null)
//   const localStreamRef = useRef<MediaStream | null>(null)
//   const remoteStreamRef = useRef<MediaStream | null>(null)
//   const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])

//   const dispatch = useAppDispatch()
//   const server = useAppSelector((state) => state.server) as ServerType
//   const userId = useAppSelector((state: RootState) => state.auth.userId)

//   const { status, callerId, targetId } = useAppSelector((state) => state.call)

//   const handleShowToggleMenu = () => setMenuOpen((prev) => !prev)

//   // ===== Media query =====
//   useEffect(() => {
//     const mediaQuery = window.matchMedia("(min-width: 769px)")
//     const handleChange = (e: MediaQueryListEvent) => {
//       setMenuOpen(e.matches)
//       setShowButton(!e.matches)
//     }
//     setMenuOpen(mediaQuery.matches)
//     setShowButton(!mediaQuery.matches)
//     mediaQuery.addEventListener("change", handleChange)
//     return () => mediaQuery.removeEventListener("change", handleChange)
//   }, [])

//   useEffect(() => {
//     dispatch(getStatusServerThunk())
//   }, [dispatch])

//   useTikServer(server?.statusServer)

//   // ===== Socket.IO и сигналинг =====
//   useEffect(() => {
//     if (!userId) return
//     const token = localStorage.getItem("accessToken")
//     if (!token) return

//     const socket = getSocket(token)
//     setSocket(socket)
//     socket.connect()

//     socket.emit("user-connected", userId)
//     socket.emit("get-online-users")

//     // ===== Статусы пользователей =====
//     socket.on("user-status-changed", ({ userId, status }) =>
//       dispatch(updateUserStatus({ userId, status }))
//     )
//     socket.on("online-users", (users) => dispatch(setOnlineStatusList(users)))
//     socket.on("new-notification", (notification) =>
//       dispatch(addNotification(notification))
//     )

//     // ===== Входящий звонок =====
//     socket.on("call:incoming", ({ from }) => {
//       console.log("call:incoming from", from)
//       dispatch(incomingCall({ callerId: from }))
//     })

//     // socket.on("call:offer", async ({ from, offer }) => {
//     //   await startCall(false, from)
//     //   await peerConnection!.setRemoteDescription(offer)
//     //   const answer = await peerConnection!.createAnswer()
//     //   await peerConnection!.setLocalDescription(answer)
//     //   socket.emit("call:answer", { to: from, answer })
//     // })
//     // socket.on("call:answer", async ({ answer }) => {
//     //   await peerConnection!.setRemoteDescription(answer)
//     // })

//     // socket.on("call:iceCandidate", async ({ candidate }) => {
//     //   if (candidate) {
//     //     try {
//     //       await peerConnection!.addIceCandidate(candidate)
//     //     } catch (err) {
//     //       console.error("ICE error", err)
//     //     }
//     //   }
//     // })
//     socket.on("call:offer", async ({ from, offer }) => {
//       await startCall(false, from)
//       await peerConnection!.setRemoteDescription(offer)

//       // Добавляем отложенные кандидаты
//       for (const c of pendingCandidatesRef.current) {
//         try {
//           await peerConnection!.addIceCandidate(new RTCIceCandidate(c))
//         } catch (err) {
//           console.error("ICE error", err)
//         }
//       }
//       pendingCandidatesRef.current = []

//       const answer = await peerConnection!.createAnswer()
//       await peerConnection!.setLocalDescription(answer)
//       socket.emit("call:answer", { to: from, answer })
//     })

//     socket.on("call:answer", async ({ answer }) => {
//       await peerConnection!.setRemoteDescription(answer)

//       // Добавляем отложенные кандидаты после получения answer
//       for (const c of pendingCandidatesRef.current) {
//         try {
//           await peerConnection!.addIceCandidate(new RTCIceCandidate(c))
//         } catch (err) {
//           console.error("ICE error", err)
//         }
//       }
//       pendingCandidatesRef.current = []
//     })

//     socket.on("call:iceCandidate", async ({ candidate }) => {
//       if (!candidate) return
//       if (!peerConnection?.remoteDescription) {
//         pendingCandidatesRef.current.push(candidate)
//       } else {
//         try {
//           await peerConnection!.addIceCandidate(new RTCIceCandidate(candidate))
//         } catch (err) {
//           console.error("ICE error", err)
//         }
//       }
//     })

//     socket.on("call:end", () => {
//       dispatch(endCall())
//       endWebRTC()
//     })

//     return () => {
//       socket.disconnect()
//     }
//   }, [userId, dispatch])

//   // ===== WebRTC =====
//   const createPeerConnection = (peer?: string) => {
//     peerConnection = new RTCPeerConnection({
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     })

//     peerConnection.onicecandidate = (e) => {
//       if (e.candidate && socket) {
//         socket.emit("call:iceCandidate", {
//           to: peer || targetId || callerId,
//           candidate: e.candidate,
//         })
//       }
//     }

//     peerConnection.ontrack = (e) => {
//       remoteStreamRef.current = e.streams[0]
//       if (remoteAudioRef.current)
//         remoteAudioRef.current.srcObject = e.streams[0]
//     }
//   }

//   const startCall = async (isCaller: boolean, peer?: string) => {
//     createPeerConnection(peer)
//     localStreamRef.current = await navigator.mediaDevices.getUserMedia({
//       audio: {
//         echoCancellation: true,
//         noiseSuppression: true,
//         autoGainControl: true,
//       },
//     })
//     localStreamRef.current
//       .getTracks()
//       .forEach((track) =>
//         peerConnection!.addTrack(track, localStreamRef.current!)
//       )
//     if (localAudioRef.current)
//       localAudioRef.current.srcObject = localStreamRef.current

//     if (isCaller && peer && socket) {
//       const offer = await peerConnection!.createOffer()
//       await peerConnection!.setLocalDescription(offer)
//       socket.emit("call:offer", { to: peer, offer })
//     }
//   }

//   const endWebRTC = () => {
//     if (peerConnection) {
//       peerConnection.close()
//       peerConnection = null
//     }
//     localStreamRef.current?.getTracks().forEach((t) => t.stop())
//     localStreamRef.current = null
//     remoteStreamRef.current = null
//   }

//   // ===== Действия пользователя =====
//   const handleCall = async (id: string) => {
//     dispatch(startOutgoingCall({ targetId: id }))
//     if (!socket) return
//     await startCall(true, id)
//   }

//   const handleAccept = () => {
//     dispatch(acceptCall())
//     if (!socket) return
//     socket.emit("call:accept", { to: callerId })
//   }

//   const handleEnd = () => {
//     dispatch(endCall())
//     if (!socket) return
//     socket.emit("call:end", { to: targetId || callerId })
//     endWebRTC()
//   }

//   if (server?.loading) return <LoadingScreen message="Сервер просыпается..." />
//   if (server?.error) return <div>Сервер не отвечает...</div>

//   return (
//     <AuthProvider>
//       <div className="containerMain">
//         <HeaderContainer
//           handleShowToggleMenu={handleShowToggleMenu}
//           showButton={showButton}
//           menuOpen={menuOpen}
//         />
//         {menuOpen && showButton && (
//           <div className={style.overlay} onClick={() => setMenuOpen(false)} />
//         )}
//         <Navbar
//           isOpen={menuOpen}
//           navRef={navRef}
//           onClose={() => setMenuOpen(false)}
//         />

//         <div className="content">{children}</div>

//         {status && (
//           <div style={{ zIndex: 1000, background: "yellow" }}>
//             <audio ref={localAudioRef} autoPlay muted />
//             <audio ref={remoteAudioRef} autoPlay />

//             {status === "idle" && (
//               <button onClick={() => handleCall("685bb3d2f6c58b803faa3ed2")}>
//                 Позвонить
//               </button>
//             )}
//             {status === "incoming" && (
//               <>
//                 <p>Входящий звонок от {callerId}</p>
//                 <button onClick={handleAccept}>Принять</button>
//                 <button onClick={handleEnd}>Отклонить</button>
//               </>
//             )}
//             {status === "calling" && (
//               <>
//                 <p>Звоним {targetId}...</p>
//                 <button onClick={handleEnd}>Отменить</button>
//               </>
//             )}
//             {status === "inCall" && (
//               <>
//                 <p>В звонке с {targetId || callerId}</p>
//                 <button onClick={handleEnd}>Завершить</button>
//               </>
//             )}
//           </div>
//         )}
//       </div>
//     </AuthProvider>
//   )
// }

// // ===== Вспомогательный компонент для загрузки =====
// const LoadingScreen = ({ message }: { message: string }) => (
//   <div
//     style={{
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       minHeight: "100vh",
//       flexDirection: "column",
//     }}
//   >
//     <div style={{ textAlign: "center" }}>{message}</div>
//     <Loading />
//   </div>
// )
