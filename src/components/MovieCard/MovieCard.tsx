"use client"
import React, { useEffect, useRef, useState } from "react"
import style from "./MovieCard.module.scss"
// import Image from "next/image"
import { UserMovieType } from "@/store/slices/userMoviesSlice"
import { translatorGenres } from "@/utils/translatorGenres"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"

export type MovieCardProps = {
  movie: UserMovieType
  onClick: () => void
  myMoviesPage: boolean
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const [needsScroll, setNeedsScroll] = useState(false)

  useEffect(() => {
    if (containerRef.current && sliderRef.current) {
      setNeedsScroll(
        sliderRef.current.scrollWidth > containerRef.current.offsetWidth
      )
    }
  }, [movie.genres])

  return (
    <>
      <div className={style.card} onClick={onClick}>
        <div className={style.imgBlock}>
          <CloudinaryImage
            src={movie.imageId?.url || "/images/monkey.jpg"}
            // src={movie.avatar}
            alt={movie.title}
            className={style.image}
            height={600}
            width={600}
          />
        </div>
        <div className={style.content}>
          <h3 className={style.title}>{movie.title}</h3>
          {movie.genres?.length > 0 ? (
            <div className={style.genresBlockContainer}>
              <div className={style.genresBlockWindow} ref={containerRef}>
                <div
                  className={`${style.genresBlockSlider} ${
                    needsScroll ? style.scroll : ""
                  }`}
                  ref={sliderRef}
                >
                  {movie.genres.map((genre, index) => (
                    <div key={index} className={style.genreItem}>
                      {translatorGenres(genre)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {movie.content && (
            <p className={style.description}>{movie.content}</p>
          )}
          {/* <span className={style.status}>
          {movie.status === "wantToSee" ? "Хочу посмотреть" : "Просмотрено"}
        </span> */}

          <div className={style.date}>
            {movie?.watchedAt && (
              <div>
                <span>watch: </span>
                <span>{new Date(movie.watchedAt).toLocaleDateString()}</span>
              </div>
            )}
            <div>
              <span>add: </span>
              <span>{new Date(movie.addedAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* <div className={style.date}>
            <span>add: </span>
            <span>{new Date(movie.addedAt).toLocaleDateString()}</span>
          </div> */}
        </div>
      </div>
    </>
  )
}

export default MovieCard
