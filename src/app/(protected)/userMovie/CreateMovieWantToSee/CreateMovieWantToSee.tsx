import ButtonMenu from "@/components/ui/button/Button"
import style from "./CreateMovieWantToSee.module.scss"
import { useForm } from "react-hook-form"
import { RootState } from "@/store/store"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  createUserMovieThunk,
  createUserMovieType,
} from "@/store/thunks/userMoviesThunk"

export default function CreateMovieWantToSee({
  closeCreateMovieWantToSee,
}: {
  closeCreateMovieWantToSee: () => void
}) {
  const dispatch = useAppDispatch()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<createUserMovieType>()
  const loading = useAppSelector((state: RootState) => state.userMovies.loading)

  const handleSave = (dataForm: createUserMovieType) => {
    console.log("dataForm", dataForm)
    try {
      dispatch(createUserMovieThunk(dataForm))

      closeCreateMovieWantToSee()
    } catch (err) {
      console.error("Ошибка публикации поста:", err)
      // можно показать уведомление об ошибке
    }
  }

  return (
    <div className={style.wrapper}>
      <div className={style.container}>
        <h3>Want to Watch</h3>
        <div>
          <form
            onSubmit={handleSubmit(handleSave)}
            className={style.ratingForm}
          >
            <div>
              <label htmlFor="title">Заголовок:</label>
              <input
                id="title"
                {...register("title", { required: "Заголовок обязателен" })}
                placeholder={"Введите заголовок"}
              />
              {errors.title && <p>{errors.title?.message as string}</p>}
              {/* <div>Имя:{profileData.name && <div>{profileData.name}</div>}</div> */}
            </div>
            <div>
              <label>Жанры:</label>
              <div>
                <label>
                  <input
                    type="checkbox"
                    value="drama"
                    {...register("genres")}
                  />{" "}
                  Драма
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="comedy"
                    {...register("genres")}
                  />{" "}
                  Комедия
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="action"
                    {...register("genres")}
                  />{" "}
                  Боевик
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="thriller"
                    {...register("genres")}
                  />{" "}
                  Триллер
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="fantasy"
                    {...register("genres")}
                  />{" "}
                  Фэнтези
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="sciFi"
                    {...register("genres")}
                  />{" "}
                  Научная фантастика
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="horror"
                    {...register("genres")}
                  />{" "}
                  Ужасы
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="romance"
                    {...register("genres")}
                  />{" "}
                  Романтика
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="adventure"
                    {...register("genres")}
                  />{" "}
                  Приключения
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="mystery"
                    {...register("genres")}
                  />{" "}
                  Детектив
                </label>
              </div>
            </div>
            <div className={style.textareaBlock}>
              <label htmlFor="content">Описание:</label>
              <textarea
                id="content"
                {...register("content")}
                placeholder={"Введите описание"}
              />
              {errors.content && <p>{errors.content?.message as string}</p>}
              {/* <div>Имя:{profileData.name && <div>{profileData.name}</div>}</div> */}
            </div>

            <div className={style.buttonBlock}>
              <ButtonMenu type="submit" disabled={loading} loading={loading}>
                Опубликовать
              </ButtonMenu>
              <ButtonMenu onClick={() => closeCreateMovieWantToSee()}>
                Отмена
              </ButtonMenu>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
