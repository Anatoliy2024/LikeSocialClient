"use client"
import { useForm, Path } from "react-hook-form"
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
import { useRouter } from "next/navigation"
import { AllRatingKeys, POST_TYPES, PostTypeKey } from "@/constants/postTypes"
import { DeleteMessageIcon } from "@/assets/icons/deleteMessageIcon"

export type FormCreatePost = {
  title: string
  content: string
  roomId: string | null
  genres: string[]
  avatarFile: FileList | null
  avatar?: string
  imageId?: imageIdType | null
  _id?: string
  postType: PostTypeKey
} & Partial<Record<AllRatingKeys, number>>

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
  const [postType, setPostType] = useState<PostTypeKey>("movie")
  // Читаем черновик один раз
  const DRAFT_KEY = roomId
    ? `post-draft:room:${roomId}${initialData?._id ? `:${initialData._id}` : ""}`
    : `post-draft:user${initialData?._id ? `:${initialData._id}` : ""}`

  const savedDraft = (() => {
    if (editMode) return null
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })()
  const [hasDraft, setHasDraft] = useState(!!savedDraft)
  console.log("editMode", editMode)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<FormCreatePost>({
    defaultValues: savedDraft || initialData || {},
  })
  const dispatch = useAppDispatch()
  const router = useRouter()
  const loading = useAppSelector((state: RootState) => state.userPost.loading)
  console.log("hasDraft", hasDraft)
  const handleSave = async (dataForm: FormCreatePost) => {
    console.log("dataForm", dataForm)
    try {
      const formData = new FormData()

      formData.append("title", dataForm.title)
      formData.append("content", dataForm.content)
      formData.append("postType", postType)

      if (roomId) {
        formData.append("roomId", roomId)
      } else if (initialData?.roomId) {
        formData.append("roomId", initialData?.roomId)
      }

      if (initialData?._id) {
        formData.append("postId", initialData._id)
      }

      Object.entries(POST_TYPES[postType].ratings).forEach(([key, config]) => {
        const value = dataForm[key as keyof typeof dataForm]

        // Если значение есть — используем его, иначе — берём min из конфига (обычно 0)
        const ratingValue =
          value !== undefined && value !== null
            ? Number(value)
            : (config.min ?? 0)

        // Всегда добавляем в FormData, clamp 0-5 на всякий случай
        const clamped = Math.max(0, Math.min(5, ratingValue))
        formData.append(`ratings[${key}]`, clamped.toString())
      })

      if (dataForm.genres) {
        dataForm.genres?.forEach((genre) => {
          formData.append("genres[]", genre)
        })
      }
      if (dataForm?.imageId && !editMode) {
        formData.append("imageId", dataForm.imageId._id)
      }

      if (dataForm.avatarFile?.[0]) {
        const file = dataForm.avatarFile?.[0]

        try {
          const compressedFile = await compressImage(file)

          console.log(
            `***********************************************До: ${(
              file.size / 1024
            ).toFixed(2)} KB | После: ${(compressedFile.size / 1024).toFixed(
              2,
            )} KB`,
          )

          formData.append("avatarFile", compressedFile)
        } catch (error) {
          console.error("Ошибка загрузки:", error)
        } finally {
          // setIsLoadingLocal(false)
        }
      }

      if (isProfile) {
        if (!editMode) {
          await dispatch(createUserPostThunk(formData)).unwrap()
          router.push(`/profile`, { scroll: false })
        } else {
          if (initialData?._id) {
            console.log("Редактирование поста в профиле", formData)
            await dispatch(updateUserPostThunk(formData)).unwrap()
          }
        }
      } else {
        console.log("isProfile", isProfile)
        console.log("formData", formData)
        if (!editMode) {
          await dispatch(createRoomPostThunk(formData)).unwrap()
          router.push(`/room/${roomId}`, { scroll: false })
        } else {
          if (initialData?._id) {
            console.log("Редактирование комнаты", formData)
            await dispatch(updateRoomPostThunk(formData)).unwrap()
          }
        }
      }

      localStorage.removeItem(DRAFT_KEY)
      setHasDraft(false)
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

  // Автосохранение черновика
  useEffect(() => {
    if (editMode) return

    const subscription = watch((values) => {
      console.log("subscription", subscription)
      try {
        const { avatarFile, ...rest } = values

        // Проверяем, есть ли хоть какие-то данные
        const hasData = Object.values(rest).some((value) => {
          if (Array.isArray(value)) return value.length > 0
          if (typeof value === "string") return value.trim() !== ""
          if (typeof value === "number") return value > 0
          if (typeof value === "boolean") return false
          return value !== null && value !== undefined
        })
        console.log("Object.values(rest)", Object.values(rest))
        console.log("hasData", hasData)
        if (hasData) {
          // Сохраняем только если есть данные
          localStorage.setItem(DRAFT_KEY, JSON.stringify(rest))
          setHasDraft(true)
        } else {
          // Если данных нет — удаляем черновик
          localStorage.removeItem(DRAFT_KEY)
          setHasDraft(false)
        }
      } catch (e) {
        console.warn("Не удалось сохранить черновик:", e)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, editMode, DRAFT_KEY])

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

  useEffect(() => {
    if (initialData?.postType) {
      setPostType(initialData.postType)
    }
  }, [initialData])

  const delDataForm = () => {
    localStorage.removeItem(DRAFT_KEY)
    setHasDraft(false)
    // 1. Сбрасываем отдельные стейты
    setPostType("movie")
    setPreview(null)

    // 2. Жестко сбрасываем все поля формы в пустые значения
    reset({
      title: "",
      content: "",
      roomId: null,
      genres: [],
      avatarFile: null,
      imageId: null,
    })
  }

  const contentRegister = register("content")

  return (
    <div className={style.postForm}>
      <div className={style.postForm__container}>
        <form
          onSubmit={handleSubmit(handleSave)}
          className={style.postForm__ratingForm}
        >
          {!editMode && hasDraft && (
            <button
              className={style.postForm__buttonReset}
              type="button"
              onClick={() => {
                if (confirm("Удалить сохранённый черновик?")) {
                  delDataForm()
                }
              }}
            >
              <DeleteMessageIcon />
              <span> clear post</span>

              {/* Очистить черновик */}
            </button>
          )}
          <div className={style.postForm__titleBlockContainer}>
            <label htmlFor="title">Заголовок:</label>
            <input
              className={style.postForm__titleBlock}
              id="title"
              {...register("title", { required: "Заголовок обязателен" })}
              placeholder={"Введите заголовок"}
            />
            {errors.title && <p>{errors.title?.message as string}</p>}
          </div>
          <div className={style.postForm__typePostSelect}>
            <select
              name="typePost"
              id="typePost"
              onChange={(e) => setPostType(e.target.value as PostTypeKey)}
              value={postType}
            >
              {Object.entries(POST_TYPES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>
          <div className={style.postForm__formImageBlock}>
            <label className={style.postForm__customFileUpload}>
              Загрузить аватарку
              <input type="file" accept="image/*" {...register("avatarFile")} />
            </label>
            {preview && (
              <div className={style.postForm__preview}>
                <CloudinaryImage
                  src={preview}
                  alt="Предпросмотр аватара"
                  className={style.postForm__preview}
                  width={200}
                  height={200}
                />
              </div>
            )}
          </div>
          {(postType === "movie" ||
            postType === "episode" ||
            postType === "letsplay") && (
            <div className={style.postForm__genresBlock}>
              <label>Жанры:</label>
              <div>
                <label>
                  <input
                    type="checkbox"
                    value="drama"
                    {...register("genres")}
                  />
                  Драма
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="comedy"
                    {...register("genres")}
                  />
                  Комедия
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="action"
                    {...register("genres")}
                  />
                  Боевик
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="thriller"
                    {...register("genres")}
                  />
                  Триллер
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="fantasy"
                    {...register("genres")}
                  />
                  Фэнтези
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="sciFi"
                    {...register("genres")}
                  />
                  Научная фантастика
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="horror"
                    {...register("genres")}
                  />
                  Ужасы
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="romance"
                    {...register("genres")}
                  />
                  Романтика
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="adventure"
                    {...register("genres")}
                  />
                  Приключения
                </label>
                <label>
                  <input
                    type="checkbox"
                    value="mystery"
                    {...register("genres")}
                  />
                  Детектив
                </label>
              </div>
            </div>
          )}

          <div className={style.postForm__textareaBlock}>
            <label htmlFor="content">Описание:</label>
            <textarea
              {...register("content")}
              placeholder={"Введите описание"}
              ref={(e) => {
                // register("content").ref(e) // связываем с react-hook-form
                contentRegister.ref(e) // ✅ Используем тот же самый экземпляр
                textareaRef.current = e // сохраняем в свой ref
              }}
              onInput={handleInput}
            />
            {errors.content && <p>{errors.content?.message as string}</p>}
          </div>
          {Object.entries(POST_TYPES[postType].ratings).map(([key, value]) => (
            <div key={key}>
              <span>{value.label}</span>
              <StarRating<FormCreatePost>
                name={key as Path<FormCreatePost>}
                setValue={setValue}
                watch={watch}
              />
            </div>
          ))}
          <div className={style.postForm__buttonBlock}>
            <ButtonMenu type="submit" disabled={loading} loading={loading}>
              {!editMode ? "Опубликовать" : "Сохранить"}
            </ButtonMenu>
            <ButtonMenu
              onClick={() => {
                delDataForm()
                hiddenBlock()
              }}
            >
              Отмена
            </ButtonMenu>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostForm
