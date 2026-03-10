// // components/PwaInstallPrompt.tsx
// "use client"
// import { useEffect, useState } from "react"

// export function PwaInstallPrompt() {
//   const [showPrompt, setShowPrompt] = useState(false)

//   useEffect(() => {
//     // Показываем только на мобильных и если ещё не установлено
//     const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
//     const isStandalone = window.matchMedia("(display-mode: standalone)").matches

//     if (isMobile && !isStandalone) {
//       setShowPrompt(true)
//     }
//   }, [])

//   if (!showPrompt) return null

//   return (
//     <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
//       <p className="text-sm font-medium mb-2">📲 Установите приложение</p>
//       <p className="text-xs opacity-90 mb-3">
//         Для работы уведомлений добавьте сайт на главный экран.
//       </p>
//       <div className="flex gap-2">
//         <button
//           onClick={() => setShowPrompt(false)}
//           className="flex-1 bg-white text-blue-600 py-2 rounded text-sm font-bold"
//         >
//           Понятно
//         </button>
//       </div>
//     </div>
//   )
// }
