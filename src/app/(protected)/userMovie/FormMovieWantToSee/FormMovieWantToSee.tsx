import ButtonMenu from "@/components/ui/button/Button"
import style from "./FormMovieWantToSee.module.scss"
import { useForm } from "react-hook-form"
import { RootState } from "@/store/store"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  createUserMovieThunk,
  createUserMovieType,
  updateUserMovieThunk,
} from "@/store/thunks/userMoviesThunk"
import { compressImage } from "@/utils/compressImage"
import { useEffect, useState } from "react"
import { CloudinaryImage } from "@/components/CloudinaryImage/CloudinaryImage"
// import { UserMovieType } from "@/store/slices/userMoviesSlice"

export default function FormMovieWantToSee({
  hiddenBlock,
  editMode,
  initialData,
}: {
  hiddenBlock: () => void
  editMode?: boolean
  initialData?: createUserMovieType
}) {
  const [preview, setPreview] = useState<string | null>(null)

  const dispatch = useAppDispatch()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<createUserMovieType>({
    defaultValues: initialData || {},
  })
  const loading = useAppSelector((state: RootState) => state.userMovies.loading)

  const handleSave = async (dataForm: createUserMovieType) => {
    console.log("dataForm", dataForm)
    try {
      const formData = new FormData()

      formData.append("title", dataForm.title)

      if (dataForm.avatarFile?.[0]) {
        const file = dataForm.avatarFile?.[0]
        // setIsLoadingLocal(true)
        try {
          const compressedFile = await compressImage(file)

          // setCompressedSize(compressedFile.size)
          console.log(
            `***********************************************До: ${(
              file.size / 1024
            ).toFixed(2)} KB | После: ${(compressedFile.size / 1024).toFixed(
              2
            )} KB`
          )
          // await onUpload(compressedFile, { roomId })
          // // await onUpload(file, context)
          // handleCloseModal()
          formData.append("avatarFile", compressedFile)
        } catch (error) {
          console.error("Ошибка загрузки:", error)
        } finally {
          // setIsLoadingLocal(false)
        }
      }

      if (dataForm.genres) {
        dataForm.genres?.forEach((genre) => {
          formData.append("genres[]", genre)
        })
      }
      if (editMode && dataForm._id) {
        formData.append("userMovieId", dataForm._id)
      }

      formData.append("content", dataForm.content)
      if (!editMode) {
        dispatch(createUserMovieThunk(formData))
      } else {
        if (!dataForm._id) return
        dispatch(
          updateUserMovieThunk({
            dataMovie: formData,
            userMovieId: dataForm._id,
          })
        )

        console.log("Edit mod")
      }

      hiddenBlock()
    } catch (err) {
      console.error("Ошибка публикации поста:", err)
      // можно показать уведомление об ошибке
    }
  }

  useEffect(() => {
    const avatar = watch("avatarFile")?.[0]
    if (avatar) {
      const url = URL.createObjectURL(avatar)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [watch("avatarFile")])

  useEffect(() => {
    if (initialData?.avatar && typeof initialData.avatar === "string") {
      setPreview(initialData.avatar)
      console.log("initialData.avatar", initialData.avatar)
    }
  }, [initialData])

  useEffect(() => {
    if (initialData?.avatar && typeof initialData.avatar === "string") {
      setPreview(initialData.avatar)
      console.log("initialData.avatar", initialData.avatar)
    }
  }, [initialData])
  useEffect(() => {
    console.log("Ошибки валидации формы:", errors)
  }, [errors])

  useEffect(() => {
    // при монтировании — запрещаем прокрутку
    document.body.style.overflow = "hidden"

    // при размонтировании — возвращаем как было
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

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
            <div className={style.formImageBlock}>
              <label className={style.customFileUpload}>
                Загрузить аватарку
                <input
                  type="file"
                  accept="image/*"
                  {...register("avatarFile")}
                />
              </label>
              {preview && (
                <div className={style.preview}>
                  <CloudinaryImage
                    src={preview}
                    alt="Предпросмотр аватара"
                    className={style.preview}
                    width={200}
                    height={200}
                  />
                </div>
              )}
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
              {/* <ButtonMenu type="submit" disabled={loading} loading={loading}>
                Опубликовать
              </ButtonMenu> */}
              <ButtonMenu type="submit" disabled={loading} loading={loading}>
                {!editMode ? "Опубликовать" : "Сохранить"}
              </ButtonMenu>
              <ButtonMenu onClick={() => hiddenBlock()}>Отмена</ButtonMenu>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
