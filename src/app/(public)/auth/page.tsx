"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import style from "./Auth.module.scss"
// import { useState } from "react"
// import { login,registr } from "@/store/slices/authSlice"
import Link from "next/link"
import ButtonMenu from "@/components/ui/button/Button"

import { RootState } from "@/store/store"
import { authThunk } from "@/store/thunks/authThunk"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { useEffect } from "react"
import { clearAuthError } from "@/store/slices/authSlice"

type FormValues = {
  username: string

  password: string
}
const Auth = () => {
  // const [data, setData] = useState({ username: "", password: "" })
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state: RootState) => state.auth.authLoading)
  const error = useAppSelector((state: RootState) => state.auth.authError)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>()
  // const logAuthfn=(type,)=>{

  // }
  const router = useRouter()
  useEffect(() => {
    dispatch(clearAuthError())
  }, [dispatch])

  const onSubmit = async (data: FormValues) => {
    console.log(data) // данные формы
    // await handleRegister(dispatch, router, data.username, data.email, data.password)
    try {
      await dispatch(authThunk(data)).unwrap() // если авторизация прошла успешно — не будет ошибки
      router.push("/profile") // переход
    } catch (err) {
      console.error("Ошибка авторизации:", err)
      // можно показать уведомление об ошибке
    }
  }
  return (
    <div className={style.wrapper}>
      <div className={style.formContainer}>
        <div>Auth</div>
        <div>{loading ? "loading" : "pending"}</div>
        <form onSubmit={handleSubmit(onSubmit)} className={style.form}>
          <div>
            <input
              id="login"
              {...register("username", {
                required: "Имя обязательно",
                minLength: {
                  value: 3,
                  message: "Имя пользователя должно быть минимум 3 символа",
                },

                validate: (value) =>
                  value.trim().length >= 3 ||
                  "Имя пользователя не может состоять из одних пробелов",
              })}
              placeholder="Введите имя"
            />
            {errors.username && <p>{errors.username?.message as string}</p>}
            <label htmlFor="login">Login</label>
          </div>

          <div>
            <input
              id="password"
              type="password"
              {...register("password", {
                required: "password обязателен",
                minLength: {
                  value: 6,
                  message: "Пароль должен быть минимум 6 символов",
                },
              })}
              placeholder="Введите password"
            />
            {errors.password && <p>{errors.password?.message as string}</p>}
            <label htmlFor="password">Password</label>
          </div>
          <div className={style.buttonBlock}>
            <ButtonMenu disabled={loading} loading={loading} type="submit">
              Authorization
            </ButtonMenu>
            <Link href="/">
              <ButtonMenu>Cancel</ButtonMenu>
            </Link>
          </div>

          <div className={style.forgotPassword}>
            <Link href="/forgot-password">Забыли пароль?</Link>
          </div>
        </form>
        <div>{error}</div>
      </div>
    </div>
  )
}
export default Auth
