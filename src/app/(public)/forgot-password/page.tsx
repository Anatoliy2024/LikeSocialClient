"use client"
import { useState } from "react"
import axios from "axios"
import { authAPI } from "@/api/api"
import ButtonMenu from "@/components/ui/button/Button"
import style from "./Forgot-password.module.scss"
import Link from "next/link"
export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await authAPI.forgotPassword(email)
      setMessage(res.message || "Письмо отправлено")
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
        <h2>Восстановление пароля</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Ваш email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className={style.buttonBlock}>
            <ButtonMenu disabled={loading} loading={loading} type="submit">
              Получить ссылку
            </ButtonMenu>
            <Link href="/">
              <ButtonMenu>Выйти</ButtonMenu>
            </Link>
          </div>
        </form>
        {message && <p>{message}</p>}
      </div>
    </div>
  )
}
