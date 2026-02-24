"use client"

import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { createTestUserThunk } from "@/store/thunks/adminThunk"
import { clearLastCreatedUser } from "@/store/slices/adminSlice"
import { useState } from "react"
import style from "./Admin.module.scss"
export default function Admin() {
  const [username, setUsername] = useState("")
  const dispatch = useAppDispatch()
  const { loading, error, lastCreatedUser } = useAppSelector(
    (state) => state.admin
  )

  const createTestAccount = async () => {
    const result = await dispatch(createTestUserThunk({ username })).unwrap()
    if (result) setUsername("")
  }

  return (
    <div className={style.admin}>
      <h1>Admin</h1>
      <div>
        <label htmlFor="user-name">Введите ник: </label>
        <input
          type="text"
          id="user-name"
          onChange={(e) => setUsername(e.target.value)}
          value={username}
        />
      </div>
      <button onClick={createTestAccount} disabled={loading}>
        {loading ? "Создаю..." : "Создать"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {lastCreatedUser && (
        <div>
          <h2>Тестовый аккаунт создан:</h2>
          <p>
            Логин: <b>{lastCreatedUser.username}</b>
          </p>
          <p>
            Пароль: <b>{lastCreatedUser.password}</b>
          </p>
          <button onClick={() => dispatch(clearLastCreatedUser())}>
            Закрыть
          </button>
        </div>
      )}
    </div>
  )
}
