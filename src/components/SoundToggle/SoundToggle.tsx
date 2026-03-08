// components/SoundToggle/SoundToggle.tsx
"use client"

import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { toggleSound } from "@/store/slices/settingsSlice"
import style from "./SoundToggle.module.scss" // или используй inline-стили

export const SoundToggle = () => {
  const dispatch = useAppDispatch()
  const soundEnabled = useAppSelector((state) => state.settings.soundEnabled)

  return (
    <div className={style.soundToggleWrapper}>
      <button
        onClick={() => dispatch(toggleSound())}
        className={style.soundToggle}
        title={
          soundEnabled
            ? "Выключить звук уведомлений"
            : "Включить звук уведомлений"
        }
        aria-label={soundEnabled ? "Выключить звук" : "Включить звук"}
      >
        {soundEnabled ? (
          // 🔊 Иконка "звук включён" (можно заменить на свои SVG)
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        ) : (
          // 🔇 Иконка "звук выключен"
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
        <span>Звук уведомлений</span>
      </button>
    </div>
  )
}
