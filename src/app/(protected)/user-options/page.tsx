"use client"
import NotificationToggleButton from "@/components/NotificationToggleButton/NotificationToggleButton"
import { SoundToggle } from "@/components/SoundToggle/SoundToggle"
import { useNotification } from "@/hooks/useNotification"
import style from "./UserOptions.module.scss"

export default function UserOption() {
  const { permission, error, token, clearTokens } = useNotification()
  return (
    <div className={style.userOption}>
      <h1>Настройки</h1>
      <div>
        <SoundToggle />
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">🔔 Push-уведомления</h2>

        {/* Кнопка включения (показывается только если ещё не решили) */}
        <NotificationToggleButton />

        {/* Статус: разрешено */}
        {permission === "granted" && (
          <div className="flex items-center gap-2 text-green-600">
            <span>✅</span>
            <span>Уведомления активны</span>
            {token && (
              <span className="text-xs text-gray-400 ml-2">
                Токен: {token.slice(0, 20)}...
              </span>
            )}
          </div>
        )}

        {/* Статус: заблокировано */}
        {permission === "denied" && (
          <div className="flex items-center gap-2 text-red-600">
            <span>❌</span>
            <span>Уведомления отключены</span>
            <span className="text-xs text-gray-400">
              (разрешите в настройках браузера)
            </span>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={clearTokens}
          className={style.userOption__delAllTokens}
        >
          удалить все уведомления
        </button>
      </section>
    </div>
  )
}
