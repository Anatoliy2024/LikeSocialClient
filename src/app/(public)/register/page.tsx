"use client"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import style from "./Register.module.scss"

// import { login,registr } from "@/store/slices/authSlice"
import Link from "next/link"
import ButtonMenu from "@/components/ui/button/Button"
import { registerThunk } from "@/store/thunks/authThunk"
import { RootState } from "@/store/store"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

type FormValues = {
  username: string
  email: string
  password: string
}

const Register = () => {
  // const [data, setData] = useState({ username: "", email: "", password: "" })
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state: RootState) => state.auth.authLoading)
  const error = useAppSelector((state: RootState) => state.auth.authError)
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>()

  const onSubmit = async (data: FormValues) => {
    console.log(data) // данные формы
    // await handleRegister(dispatch, router, data.username, data.email, data.password)
    try {
      await dispatch(registerThunk(data)).unwrap() // если авторизация прошла успешно — не будет ошибки
      router.push("/verify") // переход
    } catch (err) {
      console.error("Ошибка регистрации:", err)
      // можно показать уведомление об ошибке
    }
  }

  return (
    <div className={style.wrapper}>
      <div className={style.formContainer}>
        <div>Register</div>
        <div>{loading ? "loading" : "pending"}</div>

        <form onSubmit={handleSubmit(onSubmit)} className={style.form}>
          <div className={style.infoContainer}>
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
          <div className={style.infoContainer}>
            <input
              id="email"
              type="email"
              {...register("email", {
                required: "Email обязателен",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Неверный email",
                },
              })}
              placeholder="Введите email"
            />
            {errors.email && <p>{errors.email?.message as string}</p>}
            <label htmlFor="email">email</label>
          </div>
          <div className={style.infoContainer}>
            <input
              id="password"
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
            <ButtonMenu type="submit" disabled={loading} loading={loading}>
              Register
            </ButtonMenu>
            <Link href="/">
              <ButtonMenu>cancel</ButtonMenu>
            </Link>
          </div>
        </form>
        <div>{error}</div>
      </div>
    </div>
  )
}
export default Register
