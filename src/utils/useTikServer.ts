import { serverAPI } from "@/api/serverApi"
import { useEffect } from "react"

// import { serverAPI } from "@/api/api"

export const useTikServer = (server: boolean) => {
  useEffect(() => {
    if (!server) return
    let timeoutId: NodeJS.Timeout

    const getRandomDelay = () => {
      const min = 3 * 60 * 1000 // 3 минуты
      const max = 5 * 60 * 1000 // 5 минут
      return Math.floor(Math.random() * (max - min + 1)) + min
    }

    const tik = async () => {
      try {
        const res = await serverAPI.getTik()
        console.log("tik success", res)
        // const res = await axios.get("/api/tik")
        // console.log("tik success", res.data)
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.warn("tik failed:", err.message)
        } else {
          console.warn("tik failed: неизвестная ошибка", err)
        }
      }

      // запланировать следующий пинг с рандомной задержкой
      timeoutId = setTimeout(tik, getRandomDelay())
    }

    // стартуем первый пинг
    // timeoutId = setTimeout(tik, getRandomDelay())

    tik()

    // tik() // 🔹 сразу запускаем первый запрос

    return () => clearTimeout(timeoutId)
  }, [server])
}
