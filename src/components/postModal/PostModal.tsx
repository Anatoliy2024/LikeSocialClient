"use client"
import style from "./PostModal.module.scss"
import CloseButton from "../ui/closeButton/CloseButton"
import StarRatingView from "../starRatingView/StarRatingView"
// import Image from "next/image"
import { translatorGenres } from "@/utils/translatorGenres"
import { useEffect, useState } from "react"
import ButtonMenu from "../ui/button/Button"
import { useAppDispatch } from "@/store/hooks"
import {
  createUserCommentThunk,
  // uploadUserPostAvatarThunk,
} from "@/store/thunks/userPostThunk"
import {
  createRoomCommentThunk,
  // uploadRoomPostAvatarThunk,
} from "@/store/thunks/roomPostThunk"
import { Comment } from "../comment/Comment"
import { useForm } from "react-hook-form"
import StarRating from "../starRating/StarRating"

import { voiceAPI } from "@/api/api"
import { userPostType } from "@/store/slices/userPostsSlice"
// import { ChangeAvatarModal } from "../changeAvatarModal/ChangeAvatarModal"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
// import Link from "next/link"
import { ProfileLink } from "../ProfileLink/ProfileLink"
import { Edit } from "@/assets/icons/edit"
import PostForm, { FormCreatePost } from "../postForm/PostForm"
// import { ProfileLink } from "../ProfileLink/ProfileLink"
// import { RootState } from '@/store/store'

export type RatingFormValues = {
  stars: number
  acting: number
  specialEffects: number
  story: number
}

export type VotesType = {
  userId: { _id: string; username: string; avatar: string }
  postId: string
  roomId: string | null
  ratings: RatingFormValues
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
  const dispatch = useAppDispatch()
  // const loading = useAppSelector(
  //   (state: RootState) => state.profile.profileLoading
  // )

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

    avatar,
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
    try {
      if (roomId) {
        await dispatch(
          createRoomCommentThunk({ postId, roomId, comment })
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
  // ------- Голосование -------
  const { handleSubmit, setValue, watch, reset } = useForm<RatingFormValues>({
    defaultValues: {
      stars: 0,
      acting: 0,
      specialEffects: 0,
      story: 0,
    },
  })

  const handleVoteSubmit = async (values: {
    stars: number | undefined
    acting: number | undefined
    specialEffects: number | undefined
    story: number | undefined
  }) => {
    try {
      const dataToSend = {
        postId,
        roomId: roomId || null,
        ratings: {
          stars: values.stars || 0,
          acting: values.acting || 0,
          specialEffects: values.specialEffects || 0,
          story: values.story || 0,
        },
      }
      const res = await voiceAPI.createVoice(dataToSend)
      // console.log("res.voices", res)
      setVotes(res.votes)
      setIsEditing(false)

      reset() // очистка формы
    } catch (err) {
      console.error("Ошибка при голосовании:", err)
    }
  }

  const showEditPost = () => {
    setEditPost(true)
  }
  const closeEditPost = () => {
    setEditPost(false)
  }

  function adaptPostToForm(post: userPostType): FormCreatePost {
    return {
      title: post.title || "",
      content: post.content || "",
      roomId: post.roomId || null,
      genres: post.genres || [],
      stars: post.ratings?.stars || 0,
      acting: post.ratings?.acting || 0,
      specialEffects: post.ratings?.specialEffects || 0,
      story: post.ratings?.story || 0,
      avatarFile: null, // потому что файл ты не можешь "вернуть обратно" — он только при загрузке
      avatar: post.avatar || "",
      _id: post._id || "",
    }
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
                  src={avatar}
                  alt="avatar"
                  width={800}
                  height={800}
                />
              </div>
              <div className={style.starsBlock}>
                <h4>Оценка автора</h4>
                <div>
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
                </div>
              </div>
              {playerId !== authorId._id && (
                <div className={style.starsBlock}>
                  {myVoice && !isEditing ? (
                    <>
                      <h4>Моя оценка</h4>
                      <div>
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
                      </div>

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
                      <div>
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
                      </div>

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
                          {/* <Link href={`/profile/${v.userId._id}`}>
                            
                          </Link> */}

                          <div>
                            <div>Общая: </div>
                            <StarRatingView value={v.ratings.stars} />
                          </div>
                          <div>
                            <div>Экшен: </div>
                            <StarRatingView value={v.ratings.acting} />
                          </div>
                          <div>
                            <div>Спецэффекты: </div>
                            <StarRatingView value={v.ratings.specialEffects} />
                          </div>
                          <div>
                            <div>Сюжет: </div>
                            <StarRatingView value={v.ratings.story} />
                          </div>
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
