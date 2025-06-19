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

  // const handleRegister = async (
  //   dispatch: AppDispatch,
  //   router: ReturnType<typeof useRouter>,
  //   username: string,
  //   email: string,
  //   password: string
  // ) => {
  //   try {
  //     await dispatch(
  //       registerThunk({
  //         username,
  //         email,
  //         password,
  //       })
  //     ).unwrap() // если авторизация прошла успешно — не будет ошибки
  //     router.push("/verify") // переход
  //   } catch (err) {
  //     console.error("Ошибка регистрации:", err)
  //     // можно показать уведомление об ошибке
  //   }
  // }

  return (
    <div className={style.wrapper}>
      <div className={style.formContainer}>
        <div>Register</div>
        <div>{loading ? "loading" : "pending"}</div>
        <div>{error}</div>
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

            {/* <input
              type="text"
              name=""
              id="login"
              value={data.username}
              onChange={(e) => {
                setData({ ...data, username: e.target.value })
              }}
            />
            <label htmlFor="login">Login</label> */}
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
            {/* <input
              type="text"
              name=""
              id="email"
              value={data.email}
              onChange={(e) => {
                setData({ ...data, email: e.target.value })
              }}
            /> */}
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

            {/* <input
              type="text"
              name=""
              id="password"
              value={data.password}
              onChange={(e) => {
                setData({ ...data, password: e.target.value })
              }}
            /> */}
            {/*Изменит type="password"  */}
            <label htmlFor="password">Password</label>
          </div>
          <div className={style.buttonBlock}>
            <ButtonMenu
              type="submit"
              onClick={() => {
                // handleRegister(
                //   dispatch,
                //   router,
                //   data.username,
                //   data.email,
                //   data.password
                // )
                // dispatch(
                //   registerThunk({
                //     username: data.username,
                //     email: data.email,
                //     password: data.password,
                //   })
                // )
              }}
            >
              Register
            </ButtonMenu>
            <Link href="/">
              <ButtonMenu>cancel</ButtonMenu>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
  // return (
  //   <div className={style.wrapper}>
  //     <div className={style.formContainer}>
  //       <div>Register</div>
  //       <div>{loading ? "loading" : "pending"}</div>
  //       <div>{error}</div>
  //       <div className={style.form}>
  //
  //         <div>
  //           <input
  //             type="text"
  //             name=""
  //             id="login"
  //             value={data.username}
  //             onChange={(e) => {
  //               setData({ ...data, username: e.target.value })
  //             }}
  //           />
  //           <label htmlFor="login">Login</label>
  //         </div>
  //         <div>
  //           <input
  //             type="text"
  //             name=""
  //             id="email"
  //             value={data.email}
  //             onChange={(e) => {
  //               setData({ ...data, email: e.target.value })
  //             }}
  //           />
  //           <label htmlFor="login">email</label>
  //         </div>
  //         <div>
  //           <input
  //             type="text"
  //             name=""
  //             id="password"
  //             value={data.password}
  //             onChange={(e) => {
  //               setData({ ...data, password: e.target.value })
  //             }}
  //           />
  //           {/*Изменит type="password"  */}
  //           <label htmlFor="login">Password</label>
  //         </div>
  //         <div className={style.buttonBlock}>
  //           <ButtonMenu
  //             onClick={() => {
  //               handleRegister(
  //                 dispatch,
  //                 router,

  //                 data.username,
  //                 data.email,
  //                 data.password
  //               )
  //               // dispatch(
  //               //   registerThunk({
  //               //     username: data.username,
  //               //     email: data.email,
  //               //     password: data.password,
  //               //   })
  //               // )
  //             }}
  //           >
  //             Register
  //           </ButtonMenu>
  //           <Link href="/">
  //             <ButtonMenu>cancel</ButtonMenu>
  //           </Link>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // )
}
export default Register
