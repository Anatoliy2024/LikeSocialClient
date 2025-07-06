"use client"
import { authAPI } from "@/api/api"

import { useState } from "react"
import axios from "axios"
import style from "./Reset-password.module.scss"
import ButtonMenu from "@/components/ui/button/Button"
import Link from "next/link"
// import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
export default function ResetPassword() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [userName, setUserName] = useState("")
  const [loading, setLoading] = useState(false)
  //   const router = useRouter()
  //   const [timer,setTimer] =useState(10)
  //   const { token } = useParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log("token", token)
    try {
      const data = await authAPI.resetPassword(token, password)
      const { message, userName } = data
      //   const data = await res.json()

      setMessage(message) // "Пароль успешно обновлён"
      setUserName(userName) // Имя пользователя
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errMessage = error.response?.data?.message || "Ошибка с сервера"
        setMessage(errMessage)
      } else {
        setMessage("Неизвестная ошибка")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={style.wrapper}>
      <div className={style.container}>
        <h2>Сброс пароля</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Новый пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className={style.buttonBlock}>
            <ButtonMenu disabled={loading} loading={loading} type="submit">
              Сменить пароль
            </ButtonMenu>
            <Link href="/">
              <ButtonMenu>Выйти</ButtonMenu>
            </Link>
          </div>
          {message && (
            <p>
              {message}
              {userName && ` (userName:${userName})`}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
