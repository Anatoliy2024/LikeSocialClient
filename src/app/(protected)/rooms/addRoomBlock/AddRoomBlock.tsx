"use client"
import ButtonMenu from "@/components/ui/button/Button"
import style from "./AddRoomBlock.module.scss"
import { useForm } from "react-hook-form"
import { createRoomThunk } from "@/store/thunks/roomsThunk"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { useEffect } from "react"

export type FormValuesAddRooms = {
  name: string
  description: string
}

export const AddRoomBlock = ({
  handleCloseBlock,
}: {
  handleCloseBlock: () => void
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValuesAddRooms>()
  const dispatch = useAppDispatch()
  const loading = useAppSelector((state: RootState) => state.rooms.loading)
  const onSubmit = async (data: FormValuesAddRooms) => {
    console.log(data) // данные формы
    // await handleRegister(dispatch, router, data.username, data.email, data.password)
    try {
      await dispatch(createRoomThunk(data)).unwrap() // если авторизация прошла успешно — не будет ошибки
      handleCloseBlock()
      //   await dispatch(createRoomThunk(data)).unwrap() // если авторизация прошла успешно — не будет ошибки
    } catch (err) {
      console.error("Ошибка при создании комнаты:", err)
      // можно показать уведомление об ошибке
    }
  }
  useEffect(() => {
    // при монтировании — запрещаем прокрутку
    document.body.style.overflow = "hidden"

    // при размонтировании — возвращаем как было
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <div className={style.wrapper} onClick={handleCloseBlock}>
      <div className={style.container} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div>
            <div>
              <label htmlFor="name">Введите название комнаты</label>
              <input
                id="name"
                {...register("name", {
                  required: "Название комнаты обязательно",

                  validate: (value) =>
                    value.trim().length >= 3 ||
                    "Название комнаты не может состоять из одних пробелов",
                })}
                // placeholder="Введите название комнаты"
              />
              {errors.name && <p>{errors.name?.message as string}</p>}
            </div>
            <div>
              <label htmlFor="name">Введите описание</label>

              <textarea
                id="description"
                {...register("description", {})}
                // placeholder="Введите название комнаты"
              />
              {errors.description && (
                <p>{errors.description?.message as string}</p>
              )}
            </div>
          </div>

          <div className={style.buttonBlock}>
            <ButtonMenu type="submit" disabled={loading} loading={loading}>
              Создать комнату
            </ButtonMenu>
            <ButtonMenu onClick={handleCloseBlock}>Отмена</ButtonMenu>
          </div>
        </form>
      </div>
    </div>
  )
}
