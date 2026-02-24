"use client"
import { useAppDispatch } from "@/store/hooks"
import StarRatingView from "../starRatingView/StarRatingView"
import style from "./Post.module.scss"
import { delUserPostsThunk } from "@/store/thunks/userPostThunk"
import CloseButton from "../ui/closeButton/CloseButton"
import { formatData } from "@/utils/formatData"

import { delRoomPostsThunk } from "@/store/thunks/roomPostThunk"
import { translatorGenres } from "@/utils/translatorGenres"
import { Comments } from "@/assets/icons/comments"
import { Star } from "@/assets/icons/star"
import { userCommentType } from "@/store/slices/roomPostsSlice"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import { useState } from "react"
import ConfirmModal from "../ConfirmModal/ConfirmModal"

type PostType = {
  title: string
  content: string | null
  authorName: string | null
  avatar: string | undefined | null
  // avatarPublicId: string
  ratings: {
    acting: number
    specialEffects: number
    story: number
    stars: number
  }
  createdAt: string
  id: string
  isProfile: boolean
  isMyPost: boolean
  roomId: string | null
  genres: string[]
  onClick: () => void
  comments: userCommentType[]
  votesCount: number
  page: number
}

const Post = ({
  title,
  content,

  ratings,
  createdAt,
  id,
  isProfile,
  avatar,
  authorName,
  isMyPost,
  roomId,
  genres,
  onClick,
  comments,
  votesCount,
  page,
}: PostType) => {
  const dispatch = useAppDispatch()
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const handleDelete = async (postId: string) => {
    try {
      if (isProfile) {
        dispatch(delUserPostsThunk({ postId, page })).unwrap()
      } else {
        dispatch(delRoomPostsThunk({ postId, roomId, page })).unwrap()
      }
    } catch (err) {
      console.error("Ошибка удаления поста:", err)
      // можно показать уведомление об ошибке
    } finally {
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <div
        className={style.wrapper}
        onClick={onClick}
        // onClick={() => handleLinkToPagePost(id, roomId)}
      >
        <div className={style.blockHeaderPost}>
          <h3>{title}</h3>
          {isMyPost && (
            <CloseButton
              onClick={(e) => {
                if (e) {
                  e.stopPropagation()
                }
                setConfirmOpen(true)
                // handleDelete(id)
              }}
              title="Удалить пост"
            />
          )}
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
            {authorName}
          </div>
        )}
        <div className={style.imageStarsContainer}>
          <div className={style.blockImg}>
            <CloudinaryImage
              src={avatar || "/images/monkey.jpg"}
              alt="postImage"
              width={800}
              height={800}
            />
          </div>
          <div className={style.blockStars}>
            <div>
              <div>Общая оценка: </div>
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
        </div>
        {content && (
          <div className={style.contentPost}>
            {content
              ?.split("\n")
              .filter((line) => line.trim() !== "") // убираем пустые строки
              .map((paragraph, i) => (
                <p key={i} className={style.paragraph}>
                  {paragraph}
                </p>
              ))}
          </div>
        )}

        <div className={style.dataTimeAndStars}>
          <div>{formatData(createdAt)}</div>
          <div className={style.starCommentBlock}>
            <div>
              <span>{votesCount > 0 ? votesCount : null}</span>
              <Star />
            </div>
            <div>
              <span>{comments.length > 0 ? comments.length : null}</span>
              <Comments />
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => handleDelete(id)}
        title="Удалить пост?"
        message="Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить."
      />
    </>
  )
}

export default Post
