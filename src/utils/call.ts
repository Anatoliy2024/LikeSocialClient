// import { getSocket } from "@/lib/socket"
// import { startCall, clearIncomingCall } from "@/store/slices/callSlice"

// export const acceptCall = async (roomId: string, dispatch: any) => {
//   const socket = getSocket()
//   if (!socket.id) return
//   // 1. Уведомляем сервер, что звонок принят
//   socket.emit("acceptCall", { roomId })

//   // 2. Создаём RTCPeerConnection
//   const peerConnection = new RTCPeerConnection({
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//   })

//   // 3. Добавляем локальный аудио поток
//   const localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
//   localStream
//     .getTracks()
//     .forEach((track) => peerConnection.addTrack(track, localStream))

//   // 4. Подключаем удалённый поток к аудио элементу
//   peerConnection.ontrack = (event) => {
//     const remoteAudio = document.getElementById(
//       "remoteAudio"
//     ) as HTMLAudioElement
//     if (remoteAudio) {
//       remoteAudio.srcObject = event.streams[0]
//       remoteAudio.play()
//     }
//   }

//   // 5. Отправка ICE-кандидатов на сервер
//   peerConnection.onicecandidate = (event) => {
//     if (event.candidate) {
//       socket.emit("ice-candidate", { roomId, candidate: event.candidate })
//     }
//   }

//   // 6. Получение offer от инициатора и создание answer
//   socket.on("offer", async ({ offer }) => {
//     await peerConnection.setRemoteDescription(offer)
//     const answer = await peerConnection.createAnswer()
//     await peerConnection.setLocalDescription(answer)
//     socket.emit("answer", { roomId, answer })
//   })

//   // 7. Добавляем ICE-кандидаты от инициатора
//   socket.on("ice-candidate", (candidate) => {
//     peerConnection.addIceCandidate(candidate)
//   })

//   // 8. Обновляем Redux: звонок активен
//   dispatch(startCall({ roomId, peerId: socket.id }))
//   dispatch(clearIncomingCall())
// }
