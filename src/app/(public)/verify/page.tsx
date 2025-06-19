"use client"
import Link from "next/link"
import style from "./Verify.module.scss"
import ButtonMenu from "@/components/ui/button/Button"
import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useRouter } from "next/navigation"
import { AppDispatch, RootState } from "@/store/store"
import { verifyThunk } from "@/store/thunks/authThunk"
const Verify = () => {
  const [passwordVerify, setPasswordVerify] = useState("")
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state: RootState) => state.auth.authLoading)
  const error = useAppSelector((state: RootState) => state.auth.authError)
  const router = useRouter()
  const userName = useAppSelector((state: RootState) => state.auth.username)

  const handleVerify = async (
    dispatch: AppDispatch,
    router: ReturnType<typeof useRouter>,
    username: string,
    passwordVerify: string
  ) => {
    try {
      await dispatch(
        verifyThunk({
          username,
          passwordVerify,
        })
      ).unwrap() // если авторизация прошла успешно — не будет ошибки
      router.push("/profile") // переход
    } catch (err) {
      console.error("Ошибка авторизации:", err)
      // можно показать уведомление об ошибке
    }
  }

  return (
    <div className={style.wrapper}>
      <div className={style.formContainer}>
        <div>Verify</div>
        <div>{loading ? "loading" : "pending"}</div>
        <div>{error}</div>
        <div className={style.form}>
          <div>
            <input
              type="text"
              name=""
              id="passwordVerify"
              value={passwordVerify}
              onChange={(e) => {
                setPasswordVerify(e.target.value)
              }}
            />
            <label htmlFor="login">Password Verify</label>
          </div>

          <div className={style.buttonBlock}>
            <ButtonMenu
              onClick={() => {
                handleVerify(
                  dispatch,
                  router,
                  userName as string,
                  passwordVerify
                )
                // dispatch(
                //   registerThunk({
                //     username: data.username,
                //     email: data.email,
                //     password: data.password,
                //   })
                // )
              }}
            >
              verify
            </ButtonMenu>
            <Link href="/">
              <ButtonMenu>cancel</ButtonMenu>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Verify
