"use client"
import style from "./PostModal.module.scss"
import CloseButton from "../ui/closeButton/CloseButton"
import StarRatingView from "../starRatingView/StarRatingView"
import Image from "next/image"
import { translatorGenres } from "@/utils/translatorGenres"
import { useEffect, useState } from "react"
import ButtonMenu from "../ui/button/Button"
import { useAppDispatch } from "@/store/hooks"
import { createUserCommentThunk } from "@/store/thunks/userPostThunk"
import { createRoomCommentThunk } from "@/store/thunks/roomPostThunk"
import { Comment } from "../comment/Comment"
import { useForm } from "react-hook-form"
import StarRating from "../starRating/StarRating"

import { voiceAPI } from "@/api/api"

const PostModal = ({ post, onClose, playerId }) => {
  const dispatch = useAppDispatch()
  const [votes, setVotes] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const myVoice = votes.find((v) => v.userId._id === playerId)
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const res = await voiceAPI.getVoice(post._id)
        // console.log("res.data", res)
        console.log("res.voices", res.voices)

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
    authorName,
    imagePost,
    ratings,
    comments,
    content,
    roomId,
    _id: postId,
    authorId,
  } = post
  const [comment, setComment] = useState("")

  const handleSendComment = async () => {
    try {
      if (roomId) {
        dispatch(createRoomCommentThunk({ postId, roomId, comment })).unwrap()
        //пост комнаты  postId comment roomId отчистить  comment
      } else {
        dispatch(createUserCommentThunk({ postId, comment })).unwrap()

        //обычный пост  postId comment отчистить  comment
      }
      setComment("") // Очистка textarea после успешной отправки
    } catch (err) {
      console.log("Ошибка при отправке комментария:", err)
    }
  }
  // ------- Голосование -------
  const { handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      stars: 0,
      acting: 0,
      specialEffects: 0,
      story: 0,
    },
  })

  const handleVoteSubmit = async (values) => {
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
      console.log("res.voices", res)
      setVotes(res.votes)
      setIsEditing(false)
      // if (roomId) {
      //   dispatch(createRoomVoiceThunk(dataToSend)).unwrap()
      // } else {
      //   dispatch(createVoiceThunk(dataToSend)).unwrap()
      // }
      // тут вызови свой голосующий thunk
      console.log("Отправка голосования:", dataToSend)
      reset() // очистка формы
    } catch (err) {
      console.error("Ошибка при голосовании:", err)
    }
  }
  console.log("playerId", playerId)
  console.log("authorId", authorId)

  return (
    <div className={style.wrapper} onClick={() => onClose()}>
      <div className={style.container} onClick={(e) => e.stopPropagation()}>
        <div className={style.contentWrapper}>
          <div className={style.headerModule}>
            <h2>{title}</h2>
            <CloseButton onClick={onClose} />
          </div>
          {genres.length > 0 ? (
            <div className={style.genresBlock}>
              {genres?.map((genre, index) => (
                <div key={index}>{translatorGenres(genre)}</div>
              ))}
            </div>
          ) : null}
          <div>Автор: {authorName}</div>
          <div className={style.imageStarsBlock}>
            <div className={style.blockImg}>
              <Image src={imagePost} alt="PostImage" width={300} height={300} />
            </div>
            <div className={style.starsBlock}>
              <h4>Оценка автора</h4>
              <div>
                <div>Общая: </div>
                <StarRatingView value={ratings.stars} />
              </div>
              <div>
                <div>Экшен: </div>
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
            {playerId !== authorId && (
              <div className={style.starsBlock}>
                {myVoice && !isEditing ? (
                  <>
                    <h4>Моя оценка</h4>
                    <div>
                      <div>Общая: </div>
                      <StarRatingView value={myVoice.ratings.stars} />
                    </div>
                    <div>
                      <div>Экшен: </div>
                      <StarRatingView value={myVoice.ratings.acting} />
                    </div>
                    <div>
                      <div>Спецэффекты: </div>
                      <StarRatingView value={myVoice.ratings.specialEffects} />
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

                    <ButtonMenu type="submit">Проголосовать</ButtonMenu>
                  </form>
                )}
              </div>
            )}
            <div className={style.othersStars}>
              <h3>Другие оценки:</h3>
              {votes.filter((voice) => voice.userId._id !== playerId).length > 0
                ? votes
                    .filter((voice) => voice.userId._id !== playerId)
                    .map((v) => (
                      <div key={v._id} className={style.otherStars}>
                        <div className={style.userInfo}>
                          <div className={style.blockImg}>
                            <Image
                              src={v.userId.avatar}
                              alt="avatar"
                              width={30}
                              height={30}
                            />
                          </div>

                          <div>{v.userId.username}</div>
                        </div>

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
          <p>{content}</p>

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
                comments
                  .slice()
                  .reverse()

                  .map((comment) => (
                    <Comment key={comment._id} data={comment} />
                  ))
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
  )
}

export default PostModal
