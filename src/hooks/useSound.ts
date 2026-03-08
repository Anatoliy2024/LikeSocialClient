"use client"

import { useEffect, useRef, useCallback } from "react"

export const useSound = (src: string, volume = 0.5) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const unlockedRef = useRef(false)

  // 1. Разблокировка аудио-контекста по первому клику
  useEffect(() => {
    const unlock = () => {
      unlockedRef.current = true
      // Можно сразу попробовать проиграть тишину или короткий звук для инициализации
      document.removeEventListener("click", unlock)
      document.removeEventListener("keydown", unlock)
    }
    document.addEventListener("click", unlock)
    document.addEventListener("keydown", unlock)
    return () => {
      document.removeEventListener("click", unlock)
      document.removeEventListener("keydown", unlock)
    }
  }, [])

  // 2. Инициализация объекта Audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(src)
      audioRef.current.volume = volume
      audioRef.current.preload = "auto"
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [src, volume])

  // 3. Функция воспроизведения
  const play = useCallback(() => {
    // Если звук еще не разблокирован браузером — молчим
    if (!unlockedRef.current || !audioRef.current) return

    audioRef.current.currentTime = 0
    audioRef.current.play().catch((e) => {
      // Игнорируем ошибки автовоспроизведения, если они проскочили проверку
      console.warn("Sound play error:", e)
    })
  }, [])

  return play
}
