"use client"
import { useForm } from "react-hook-form"
import ButtonMenu from "../ui/button/Button"
import style from "./CreatePost.module.scss"

import StarRating from "../starRating/StarRating"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { createUserPostThunk } from "@/store/thunks/userPostThunk"
import { createRoomPostThunk } from "@/store/thunks/roomPostThunk"
import { RootState } from "@/store/store"

// import { useParams } from "next/navigation"
// type FormCreatePost = {
//   title: string
//   //   avatar:string
//   content: string
//   stars: number
//   ratings: { [key: string]: string }
//   acting: string
//   specialEffects: string
//   story: string
//   genres: { [key: string]: string }
// }

// type PostRatings = {
//   stars: number
//   acting: number
//   specialEffects: number
//   story: number
// }

// type PostFormDataToSend = {
//   title: string
//   content: string
//   roomId: string | null
//   ratings: PostRatings
//   genres: string[]
// }
type FormCreatePost = {
  title: string
  content: string
  roomId: string | null

  genres: string[]
  stars: number
  acting: number
  specialEffects: number
  story: number
}

const CreatePost = ({
  hiddenBlock,
  isProfile,
  roomId,
}: {
  hiddenBlock: () => void
  isProfile: boolean
  roomId: string | null
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormCreatePost>()
  const dispatch = useAppDispatch()
  // const { id } = useParams()
  const loading = useAppSelector((state: RootState) => state.userPost.loading)

  const handleSave = (dataForm: FormCreatePost) => {
    console.log("dataForm", dataForm)
    try {
      const dataToSend = {
        title: dataForm.title,
        content: dataForm.content,
        roomId: roomId ? roomId : undefined,
        ratings: {
          stars: dataForm.stars,
          acting: dataForm.acting,
          specialEffects: dataForm.specialEffects,
          story: dataForm.story,
        },
        genres: dataForm.genres ? [...dataForm.genres] : [],
      }
      if (isProfile) {
        dispatch(createUserPostThunk(dataToSend))
      } else {
        dispatch(createRoomPostThunk(dataToSend))
      }

      hiddenBlock()
    } catch (err) {
      console.error("Ошибка публикации поста:", err)
      // можно показать уведомление об ошибке
    }
    // const dataToSend = {
    //   userInfo: {
    //     name: dataForm.name,
    //     sureName: dataForm.sureName,
    //     status: dataForm.status,
    //     age: dataForm.age,
    //     relationshipStatus: dataForm.relationshipStatus,
    //     address: {
    //       country: dataForm.country,
    //       city: dataForm.city,
    //     },
    //   },
    // }

    // dispatch(changeMyProfileThunk(dataToSend))
    // // здесь можно собрать данные и отправить на сервер
    // setIsEdit(false)
  }

  return (
    <div className={style.wrapper}>
      <div className={style.container}>
        <form onSubmit={handleSubmit(handleSave)} className={style.ratingForm}>
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
              id="content"
              {...register("content")}
              placeholder={"Введите описание"}
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

          <div>
            <ButtonMenu type="submit" disabled={loading} loading={loading}>
              Опубликовать
            </ButtonMenu>
            <ButtonMenu onClick={() => hiddenBlock()}>Отмена</ButtonMenu>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePost

// title
// content
// stars
// ratings
// acting
// specialEffects
// story
