"use client"
import { useForm } from "react-hook-form"
import ButtonMenu from "../ui/button/Button"
import style from "./PostForm.module.scss"

import StarRating from "../starRating/StarRating"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  createUserPostThunk,
  updateUserPostThunk,
} from "@/store/thunks/userPostThunk"
import {
  createRoomPostThunk,
  updateRoomPostThunk,
} from "@/store/thunks/roomPostThunk"
import { RootState } from "@/store/store"
import { useEffect, useRef, useState } from "react"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import { compressImage } from "@/utils/compressImage"
import { imageIdType } from "@/store/slices/userPostsSlice"

export type FormCreatePost = {
  title: string
  content: string
  roomId: string | null
  genres: string[]
  stars: number
  acting: number
  specialEffects: number
  story: number
  avatarFile: FileList | null
  avatar?: string
  imageId?: imageIdType | null
  _id?: string
}

const PostForm = ({
  hiddenBlock,
  isProfile,
  roomId,
  editMode,
  initialData,
}: {
  hiddenBlock: () => void
  isProfile: boolean
  roomId: string | null | undefined
  editMode?: boolean
  initialData?: Partial<FormCreatePost>
}) => {
  const [preview, setPreview] = useState<string | null>(null)
  // const [loadingLocal, setIsLoadingLocal] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormCreatePost>({
    defaultValues: initialData || {},
  })
  const dispatch = useAppDispatch()
  // const { id } = useParams()
  const loading = useAppSelector((state: RootState) => state.userPost.loading)

  const handleSave = async (dataForm: FormCreatePost) => {
    console.log("dataForm", dataForm)
    try {
      const formData = new FormData()

      formData.append("title", dataForm.title)
      formData.append("content", dataForm.content)

      if (roomId) {
        formData.append("roomId", roomId)
      } else if (initialData?.roomId) {
        formData.append("roomId", initialData?.roomId)
      }

      if (initialData?._id) {
        formData.append("postId", initialData._id)
      }

      formData.append("ratings[stars]", dataForm.stars?.toString())
      formData.append("ratings[acting]", dataForm.acting?.toString())
      formData.append(
        "ratings[specialEffects]",
        dataForm.specialEffects?.toString()
      )
      formData.append("ratings[story]", dataForm.story?.toString())

      if (dataForm.genres) {
        dataForm.genres?.forEach((genre) => {
          formData.append("genres[]", genre)
        })
      }

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

      if (isProfile) {
        if (!editMode) {
          dispatch(createUserPostThunk(formData))
        } else {
          if (initialData?._id) {
            console.log("Редактирование поста в профиле", formData)
            dispatch(updateUserPostThunk(formData))
          }
        }
      } else {
        console.log("isProfile", isProfile)
        console.log("formData", formData)
        if (!editMode) {
          dispatch(createRoomPostThunk(formData))
        } else {
          if (initialData?._id) {
            console.log("Редактирование комнаты", formData)
            dispatch(updateRoomPostThunk(formData))
          }
        }
      }

      hiddenBlock()
    } catch (err) {
      console.error("Ошибка публикации поста:", err)
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

  useEffect(() => {
    const avatar = watch("avatarFile")?.[0]
    if (avatar) {
      const url = URL.createObjectURL(avatar)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [watch("avatarFile")])

  useEffect(() => {
    if (
      initialData?.imageId?.url &&
      typeof initialData?.imageId?.url === "string"
    ) {
      setPreview(initialData?.imageId?.url)
      console.log("initialData.avatar", initialData?.imageId?.url)
    }
  }, [initialData?.imageId?.url])
  useEffect(() => {
    console.log("Ошибки валидации формы:", errors)
  }, [errors])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInput = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = el.scrollHeight + "px"
    }
  }
  useEffect(() => {
    handleInput()
  }, [watch("content")])

  return (
    <div
      className={style.wrapper}
      // onClick={() => hiddenBlock()}
    >
      <div
        className={style.container}
        //  onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(handleSave)} className={style.ratingForm}>
          <div>
            <label htmlFor="title">Заголовок:</label>
            <input
              className={style.titleBlock}
              id="title"
              {...register("title", { required: "Заголовок обязателен" })}
              placeholder={"Введите заголовок"}
            />
            {errors.title && <p>{errors.title?.message as string}</p>}
          </div>
          <div className={style.formImageBlock}>
            <label className={style.customFileUpload}>
              Загрузить аватарку
              <input type="file" accept="image/*" {...register("avatarFile")} />
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
          <div className={style.genresBlock}>
            <label>Жанры:</label>
            <div>
              <label>
                <input type="checkbox" value="drama" {...register("genres")} />{" "}
                Драма
              </label>
              <label>
                <input type="checkbox" value="comedy" {...register("genres")} />{" "}
                Комедия
              </label>
              <label>
                <input type="checkbox" value="action" {...register("genres")} />{" "}
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
                <input type="checkbox" value="sciFi" {...register("genres")} />{" "}
                Научная фантастика
              </label>
              <label>
                <input type="checkbox" value="horror" {...register("genres")} />{" "}
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
              // id="content"
              {...register("content")}
              placeholder={"Введите описание"}
              // ref={textareaRef}
              ref={(e) => {
                register("content").ref(e) // связываем с react-hook-form
                textareaRef.current = e // сохраняем в свой ref
              }}
              onInput={handleInput}
            />
            {errors.content && <p>{errors.content?.message as string}</p>}
            {/* <div>Имя:{profileData.name && <div>{profileData.name}</div>}</div> */}
          </div>

          <div>
            <span>Звёзды:</span>
            <StarRating<FormCreatePost, "stars">
              name="stars"
              setValue={setValue}
              watch={watch}
            />
          </div>
          <div>
            <span>Актерская игра:</span>

            <StarRating<FormCreatePost, "acting">
              name="acting"
              setValue={setValue}
              watch={watch}
            />
          </div>

          <div>
            <span>Спецэффекты :</span>
            <StarRating<FormCreatePost, "specialEffects">
              name="specialEffects"
              setValue={setValue}
              watch={watch}
            />
          </div>

          <div>
            <span>Сюжет:</span>
            <StarRating<FormCreatePost, "story">
              name="story"
              setValue={setValue}
              watch={watch}
            />
          </div>

          <div className={style.buttonBlock}>
            <ButtonMenu type="submit" disabled={loading} loading={loading}>
              {!editMode ? "Опубликовать" : "Сохранить"}
            </ButtonMenu>
            <ButtonMenu onClick={() => hiddenBlock()}>Отмена</ButtonMenu>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostForm
