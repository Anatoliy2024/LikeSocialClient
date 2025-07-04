import React from "react"
import style from "./MovieCard.module.scss"
import Image from "next/image"
import { UserMovieType } from "@/store/slices/userMoviesSlice"
import { translatorGenres } from "@/utils/translatorGenres"

export type MovieCardProps = {
  movie: UserMovieType
  onClick: () => void
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  return (
    <div className={style.card} onClick={onClick}>
      <div className={style.imgBlock}>
        <Image
          src={movie.avatar}
          alt={movie.title}
          className={style.image}
          height={180}
          width={180}
        />
      </div>
      <div className={style.content}>
        <h3 className={style.title}>{movie.title}</h3>
        {movie.genres?.length > 0 ? (
          <div className={style.genresBlockContainer}>
            <div className={style.genresBlockWindow}>
              <div className={style.genresBlockSlider}>
                {movie.genres.map((genre, index) => (
                  <div key={index}>{translatorGenres(genre)}</div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        {movie.content && <p className={style.description}>{movie.content}</p>}
        {/* <span className={style.status}>
          {movie.status === "wantToSee" ? "Хочу посмотреть" : "Просмотрено"}
        </span> */}
        <span className={style.date}>
          {new Date(movie.addedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

export default MovieCard
