// import { getSocket } from "@/lib/socket"

// let peerConnection: RTCPeerConnection | null = null
// let socket = getSocket()

// export const createPeerConnection = (socket: any, roomId: string) => {
//   peerConnection = new RTCPeerConnection({
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   })

//   // Локальный поток
//   navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
//     stream
//       .getTracks()
//       .forEach((track) => peerConnection!.addTrack(track, stream))
//   })

//   // Удалённый поток
//   peerConnection.ontrack = (event) => {
//     const remoteAudio = document.getElementById(
//       "remoteAudio"
//     ) as HTMLAudioElement
//     if (remoteAudio) {
//       remoteAudio.srcObject = event.streams[0]
//       remoteAudio.play()
//     }
//   }

//   // ICE кандидаты
//   peerConnection.onicecandidate = (event) => {
//     if (event.candidate) {
//       socket.emit("ice-candidate", {
//         toSocketId: roomId,
//         candidate: event.candidate,
//       })
//     }
//   }

//   return peerConnection
// }

// export const handleOffer = async (
//   offer: RTCSessionDescriptionInit,
//   socket: any,
//   fromSocketId: string
// ) => {
//   if (!peerConnection) await createPeerConnection(fromSocketId)
//   await peerConnection.setRemoteDescription(offer)
//   const answer = await peerConnection.createAnswer()
//   await peerConnection.setLocalDescription(answer)
//   socket.emit("answer", { toSocketId: fromSocketId, answer })
// }

// export const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
//   if (!peerConnection) return
//   await peerConnection.setRemoteDescription(answer)
// }

// export const handleIceCandidate = async (candidate: RTCIceCandidate) => {
//   if (!peerConnection) return
//   await peerConnection.addIceCandidate(candidate)
// }
