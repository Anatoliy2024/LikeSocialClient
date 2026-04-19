"use client"
import style from "./PostModal.module.scss"
import CloseButton from "../ui/closeButton/CloseButton"
import StarRatingView from "../starRatingView/StarRatingView"
// import Image from "next/image"
import { translatorGenres } from "@/utils/translatorGenres"
import { useEffect, useState } from "react"
import ButtonMenu from "../ui/button/Button"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  createUserCommentThunk,
  // uploadUserPostAvatarThunk,
} from "@/store/thunks/userPostThunk"
import {
  createRoomCommentThunk,
  // uploadRoomPostAvatarThunk,
} from "@/store/thunks/roomPostThunk"
import { Comment } from "../comment/Comment"
import { useForm, UseFormSetValue, UseFormWatch } from "react-hook-form"
import StarRating from "../starRating/StarRating"

// import { voiceAPI } from "@/api/api"
import { userPostType } from "@/store/slices/userPostsSlice"
// import { ChangeAvatarModal } from "../changeAvatarModal/ChangeAvatarModal"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
// import Link from "next/link"
import { ProfileLink } from "../ProfileLink/ProfileLink"
import { Edit } from "@/assets/icons/edit"
import PostForm, { FormCreatePost } from "../postForm/PostForm"
import { addUserMovieThunk } from "@/store/thunks/userMoviesThunk"
import { RootState } from "@/store/store"
import Spinner from "../ui/spinner/Spinner"
import { voiceAPI } from "@/api/voiceAPI"
import { POST_TYPES, PostTypeKey } from "@/constants/postTypes"
// import { ProfileLink } from "../ProfileLink/ProfileLink"
// import { RootState } from '@/store/store'

// export type RatingFormValues = {
//   stars: number
//   acting: number
//   specialEffects: number
//   story: number
// }
export type RatingFormValues = Record<string, number>
export type VotesType = {
  userId: { _id: string; username: string; avatar: string }
  postId: string
  roomId: string | null
  ratings: Record<string, number>
  // ratings: RatingFormValues
  createdAt: string
  _id: string
}

const PostModal = ({
  post,
  onClose,
  playerId,
}: {
  post: userPostType
  onClose: () => void
  playerId: string
}) => {
  // console.log("post", post)
  const [loading, setLoading] = useState(false)
  const [addMovie, setAddMovie] = useState(false)
  const [sendingVoice, setSendingVoice] = useState(false)
  const dispatch = useAppDispatch()
  const loadingUserMovies = useAppSelector(
    (state: RootState) => state.userMovies.loading,
  )

  const [votes, setVotes] = useState<VotesType[]>([])
  const [isEditing, setIsEditing] = useState(false)
  // const [changeAvatarModal, setChangeAvatarModal] = useState(false)
  const myVoice = votes.find((v) => v.userId._id === playerId)
  // console.log("votes***", votes)
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const res = await voiceAPI.getVoice(post._id)
        // console.log("res.data", res)
        // console.log("res.voices", res.voices)

        setVotes(res.votes)
      } catch (err) {
        console.error("Ошибка загрузки голосов:", err)
      }
    }

    fetchVoices()
  }, [post._id])

  const {
    genres,
    title,
    imageId,
    // avatar,
    ratings,
    comments,
    content,
    roomId,
    _id: postId,
    authorId,
  } = post

  const authorName = post.authorId.username
  const [comment, setComment] = useState("")
  const [editPost, setEditPost] = useState(false)

  const handleSendComment = async () => {
    setLoading(true)
    // setSendingVoice(true)
    try {
      if (roomId) {
        await dispatch(
          createRoomCommentThunk({ postId, roomId, comment }),
        ).unwrap()
        //пост комнаты  postId comment roomId отчистить  comment
      } else {
        await dispatch(createUserCommentThunk({ postId, comment })).unwrap()

        //обычный пост  postId comment отчистить  comment
      }
      setComment("") // Очистка textarea после успешной отправки
    } catch (err) {
      console.log("Ошибка при отправке комментария:", err)
    } finally {
      setLoading(false)
    }
  }

  const getDefaultRatingValues = (
    postType: PostTypeKey | undefined,
  ): RatingFormValues => {
    const config = POST_TYPES[postType || "movie"].ratings
    return Object.entries(config).reduce((acc, [key, { min = 0 }]) => {
      acc[key] = min // обычно 0
      return acc
    }, {} as RatingFormValues)
  }

  // ------- Голосование -------
  const { handleSubmit, setValue, watch, reset } = useForm<RatingFormValues>({
    defaultValues: getDefaultRatingValues(post.postType),
  })

  const handleVoteSubmit = async (values: RatingFormValues) => {
    setSendingVoice(true)

    try {
      // Собираем только те рейтинги, которые есть в конфиге текущего типа поста
      const ratingsPayload = Object.keys(
        POST_TYPES[post.postType].ratings,
      ).reduce(
        (acc, key) => {
          const value = values[key]
          acc[key] = value !== undefined && value !== null ? Number(value) : 0
          return acc
        },
        {} as Record<string, number>,
      )

      const dataToSend = {
        postId,
        roomId: roomId || null,
        ratings: ratingsPayload,
      }

      const res = await voiceAPI.createVoice(dataToSend)
      setVotes(res.votes)
      setIsEditing(false)
      reset()
    } catch (err) {
      console.error("Ошибка при голосовании:", err)
    } finally {
      setSendingVoice(false)
    }
  }

  const showEditPost = () => {
    setEditPost(true)
  }
  const closeEditPost = () => {
    setEditPost(false)
  }

  function adaptPostToForm(post: userPostType): FormCreatePost {
    const allRatingKeys = Object.values(POST_TYPES).flatMap((type) =>
      Object.keys(type.ratings),
    )

    // 🎯 Собираем рейтинги в отдельный объект
    const ratingsFields = allRatingKeys.reduce(
      (acc, key) => {
        const value = post.ratings?.[key]
        acc[key] = typeof value === "number" ? value : 0
        return acc
      },
      {} as Record<string, number>,
    ) // ← ключевой тип!
    console.log("ratingsFields***", ratingsFields)

    return {
      title: post.title || "",
      content: post.content || "",
      roomId: post.roomId || null,
      genres: post.genres || [],

      avatarFile: null,
      imageId: post.imageId,
      _id: post._id || "",
      postType: post.postType,
      ...ratingsFields,
    }
  }

  // function adaptPostToForm(post: userPostType): FormCreatePost {
  //   return {
  //     title: post.title || "",
  //     content: post.content || "",
  //     roomId: post.roomId || null,
  //     genres: post.genres || [],
  //     stars: post.ratings?.stars || 0,
  //     acting: post.ratings?.acting || 0,
  //     specialEffects: post.ratings?.specialEffects || 0,
  //     story: post.ratings?.story || 0,
  //     avatarFile: null, // потому что файл ты не можешь "вернуть обратно" — он только при загрузке
  //     // avatar: post.imageId?.url || "",
  //     imageId: post.imageId,
  //     _id: post._id || "",
  //   }
  // }
  const addUserMovie = async () => {
    try {
      await dispatch(addUserMovieThunk({ postId, roomId })).then(() => {
        setAddMovie(true)
      })
    } catch (e) {
      console.log(e)
    }
  }

  // Внутри компонента, перед return
  const renderRatings = (
    ratings: Record<string, number>,
    postType: PostTypeKey | undefined,
    readOnly = true,
    formMethods?: {
      setValue: UseFormSetValue<RatingFormValues>
      watch: UseFormWatch<RatingFormValues>
    },
  ) => {
    const config = POST_TYPES[postType || "movie"].ratings

    return Object.entries(config).map(([key, { label, min = 0 }]) => {
      const value = ratings?.[key] ?? min

      if (readOnly) {
        // Режим просмотра
        return (
          <div key={key}>
            <div>{label}: </div>
            <StarRatingView value={value} />
          </div>
        )
      } else if (formMethods) {
        // Режим формы (голосование)
        const { setValue, watch } = formMethods
        return (
          <div key={key}>
            <span>{label}:</span>
            <StarRating
              name={key as keyof RatingFormValues}
              setValue={setValue}
              watch={watch}
            />
          </div>
        )
      }
      return null
    })
  }

  // console.log("post", post)
  return (
    <>
      {authorId._id === playerId && editPost && (
        <PostForm
          isProfile={!roomId}
          roomId={roomId}
          hiddenBlock={closeEditPost}
          editMode={true}
          initialData={adaptPostToForm(post)}
        />
      )}
      <div className={style.wrapper} onClick={() => onClose()}>
        <div className={style.container} onClick={(e) => e.stopPropagation()}>
          <div className={style.contentWrapper}>
            <div className={style.headerModule}>
              <h2>{title}</h2>
              <div className={style.headerModuleButtonBlock}>
                {authorId._id === playerId && (
                  <div className={style.buttonBlockEdit} onClick={showEditPost}>
                    <Edit />
                  </div>
                )}
                <CloseButton onClick={onClose} />
              </div>
            </div>
            {genres.length > 0 ? (
              <div className={style.genresBlock}>
                {genres?.map((genre, index) => (
                  <div key={index}>{translatorGenres(genre)}</div>
                ))}
              </div>
            ) : null}
            {authorName && roomId && (
              <div className={style.blockAuthorName}>
                <span>Автор: </span>
                <div>{authorName}</div>
              </div>
            )}
            <div className={style.imageStarsBlock}>
              <div className={style.blockImg}>
                <CloudinaryImage
                  src={imageId?.url || "/images/monkey.jpg"}
                  alt="avatar"
                  width={800}
                  height={800}
                />
              </div>
              <div className={style.starsBlock}>
                <h4>Оценка автора</h4>
                {renderRatings(ratings, post.postType, true)}
                {/* <div>
                  <div>Общая: </div>
                  <StarRatingView value={ratings.stars} />
                </div>
                <div>
                  <div>Актерская игра: </div>
                  <StarRatingView value={ratings.acting} />
                </div>
                <div>
                  <div>Спецэффекты: </div>
                  <StarRatingView value={ratings.specialEffects} />
                </div>
                <div>
                  <div>Сюжет: </div>
                  <StarRatingView value={ratings.story} />
                </div> */}
              </div>
              {playerId !== authorId._id && (
                <div className={style.starsBlock}>
                  {myVoice && !isEditing ? (
                    <>
                      <h4>Моя оценка</h4>
                      {renderRatings(myVoice.ratings, post.postType, true)}
                      {/* <div>
                        <div>Общая: </div>
                        <StarRatingView value={myVoice.ratings.stars} />
                      </div>
                      <div>
                        <div>Актерская игра: </div>
                        <StarRatingView value={myVoice.ratings.acting} />
                      </div>
                      <div>
                        <div>Спецэффекты: </div>
                        <StarRatingView
                          value={myVoice.ratings.specialEffects}
                        />
                      </div>
                      <div>
                        <div>Сюжет: </div>
                        <StarRatingView value={myVoice.ratings.story} />
                      </div> */}

                      <ButtonMenu
                        onClick={() => {
                          setIsEditing(true)
                        }}
                      >
                        Редактировать
                      </ButtonMenu>
                    </>
                  ) : (
                    <form onSubmit={handleSubmit(handleVoteSubmit)}>
                      {sendingVoice && (
                        <div className={style.spinnerWrapper}>
                          <Spinner />
                        </div>
                      )}
                      {renderRatings({}, post.postType, false, {
                        setValue,
                        watch,
                      })}
                      {/* <div>
                        <span>Звёзды:</span>
                        <StarRating
                          name="stars"
                          setValue={setValue}
                          watch={watch}
                        />
                      </div>
                      <div>
                        <span>Актёрская игра:</span>
                        <StarRating
                          name="acting"
                          setValue={setValue}
                          watch={watch}
                        />
                      </div>
                      <div>
                        <span>Спецэффекты:</span>
                        <StarRating
                          name="specialEffects"
                          setValue={setValue}
                          watch={watch}
                        />
                      </div>
                      <div>
                        <span>Сюжет:</span>
                        <StarRating
                          name="story"
                          setValue={setValue}
                          watch={watch}
                        />
                      </div> */}

                      <ButtonMenu
                        type="submit"
                        disabled={loading}
                        loading={loading}
                      >
                        Проголосовать
                      </ButtonMenu>
                    </form>
                  )}
                </div>
              )}
              <div className={style.othersStars}>
                <h3>Другие оценки:</h3>
                {votes.filter((voice) => voice.userId._id !== playerId).length >
                0
                  ? votes
                      .filter((voice) => voice.userId._id !== playerId)
                      .map((v) => (
                        <div key={v._id} className={style.otherStars}>
                          <ProfileLink
                            userId={v.userId._id}
                            currentUserId={playerId}
                          >
                            <div className={style.userInfo}>
                              <div className={style.blockImg}>
                                <CloudinaryImage
                                  src={v.userId.avatar}
                                  alt="avatar"
                                  width={100}
                                  height={100}
                                />
                              </div>

                              <div>{v.userId.username}</div>
                            </div>
                          </ProfileLink>
                          {renderRatings(v.ratings, post.postType, true)}

                          {/* <div>
                            <div>Общая: </div>
                            <StarRatingView value={v.ratings.stars} />
                          </div>
                          <div>
                            <div>Актерская игра: </div>
                            <StarRatingView value={v.ratings.acting} />
                          </div>
                          <div>
                            <div>Спецэффекты: </div>
                            <StarRatingView value={v.ratings.specialEffects} />
                          </div>
                          <div>
                            <div>Сюжет: </div>
                            <StarRatingView value={v.ratings.story} />
                          </div> */}
                        </div>
                      ))
                  : "Других оценок нет"}
              </div>
            </div>
            <div className={style.contentBlock}>
              {content
                ?.split("\n")
                .filter((line) => line.trim() !== "") // убираем пустые строки
                .map((paragraph, i) => (
                  <p key={i} className={style.paragraph}>
                    {paragraph}
                  </p>
                ))}
            </div>
            {authorId._id !== playerId && (
              <ButtonMenu
                disabled={addMovie}
                loading={loadingUserMovies}
                onClick={() => {
                  addUserMovie()
                }}
              >
                {!addMovie ? "Добавить в WantToSee" : "Добавлено!"}
              </ButtonMenu>
            )}

            {/* <div className={style.contentBlock}>{content}</div> */}

            <div className={style.commentsBlock}>
              <div className={style.createCommentsBlock}>
                <div>Оставить комментарий:</div>

                <textarea
                  placeholder="Введите комментарий"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <ButtonMenu
                  onClick={() => {
                    handleSendComment()
                  }}
                >
                  Отправить
                </ButtonMenu>
              </div>
              <div className={style.showCommentsBlock}>
                <h3>Комментарии:</h3>
                {comments?.length > 0 ? (
                  <div className={style.commentList}>
                    {comments
                      .slice()
                      .reverse()

                      .map((comment) => (
                        <Comment
                          key={comment._id}
                          data={comment}
                          playerId={playerId}
                        />
                      ))}
                  </div>
                ) : (
                  <p>Комментариев нет</p>
                )}
              </div>
            </div>
            {/* <div>
          <h3>Оценки:</h3>
          {post.comments?.length > 0 ? (
            post.comments.map((c, i) => <p key={i}>• {c.text}</p>)
          ) : (
            <p>Комментариев нет</p>
          )}
        </div> */}
          </div>
        </div>
      </div>
    </>
  )
}

export default PostModal
