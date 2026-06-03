import { TRACKERS } from "@/constants/webTorrentConfig"
import { useState, useEffect, useMemo } from "react"

const CACHE_KEY = "webtorrent_trackers"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 час

export function useTrackers() {
  const [trackers, setTrackers] = useState<string[]>(TRACKERS)
  const [loading, setLoading] = useState(true)

  // Дедупликация через useMemo
  const uniqueTrackers = useMemo(() => {
    return Array.from(new Set(trackers))
  }, [trackers])

  useEffect(() => {
    let isMounted = true
    const loadTrackers = async () => {
      // Проверяем кэш в localStorage
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_TTL && Array.isArray(data)) {
            if (isMounted) {
              setTrackers((prev) => [...prev, ...data])
              setLoading(false)
            }
            return
          }
        } catch {
          // Битый кэш — удаляем и идём дальше
          localStorage.removeItem(CACHE_KEY)
        }
      }

      try {
        // Пробуем jsdelivr (быстрее)
        const response = await fetch(
          "https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all_ws.txt",
        )

        if (!response.ok) throw new Error("Fetch failed")

        const text = await response.text()
        const list = text.split("\n").filter((line) => line.trim().length > 0)

        if (list.length > 0 && isMounted) {
          setTrackers((prev) => [...prev, ...list])
          console.log("Существующие трекеры", trackers)
          console.log("Добавили новые трекеры", list)
          // Сохраняем в кэш
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              data: list,
              timestamp: Date.now(),
            }),
          )
        }
      } catch (error) {
        console.warn("Using fallback trackers:", error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadTrackers()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    trackers: uniqueTrackers,
    totalTrackers: uniqueTrackers.length,
    loading,
  }
}
