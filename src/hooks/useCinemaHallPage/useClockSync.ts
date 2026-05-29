import { useEffect, useRef } from "react"
import { Socket } from "socket.io-client"

// Глобальный офсет — разница между часами сервера и клиента
let globalClockOffset = 0

export const getServerNow = () => Date.now() + globalClockOffset

export function useClockSync(socket: Socket | null) {
  const syncedRef = useRef(false)

  useEffect(() => {
    if (!socket || syncedRef.current) return

    const sync = () => {
      const clientTime = Date.now()
      socket.emit(
        "cinema-hall:ping-time",
        { clientTime },
        (res: { serverTime: number; clientTime: number }) => {
          const rtt = Date.now() - res.clientTime
          // Оцениваем время сервера с учётом половины RTT
          globalClockOffset = res.serverTime - Date.now() + rtt / 2
          syncedRef.current = true
          console.log(
            `🕐 Clock sync: offset=${globalClockOffset.toFixed(0)}ms, rtt=${rtt}ms`,
          )
        },
      )
    }

    sync()
    // Пересинхронизируем каждые 30 секунд на случай дрейфа
    const interval = setInterval(sync, 30_000)
    return () => clearInterval(interval)
  }, [socket])
}
