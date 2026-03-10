"use client"
import { SoundToggle } from "@/components/SoundToggle/SoundToggle"
import style from "./UserOptions.module.scss"
import { PushNotification } from "@/components/PushNotification/PushNotification"

export default function UserOption() {
  return (
    <div className={style.userOption}>
      <h1>Настройки</h1>
      <div>
        <SoundToggle />
      </div>
      <PushNotification />
    </div>
  )
}
