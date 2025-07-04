"use client"
import { UserMovieType } from "@/store/slices/userMoviesSlice"
import style from "./modalUserMovie.module.scss"
import Image from "next/image"
import ButtonMenu from "@/components/ui/button/Button"
import { translatorGenres } from "@/utils/translatorGenres"
import { useEffect } from "react"
import CloseButton from "@/components/ui/closeButton/CloseButton"
import {
  deleteUserMovieThunk,
  toggleUserMovieStatusThunk,
} from "@/store/thunks/userMoviesThunk"
import { useAppDispatch } from "@/store/hooks"
export const ModalUserMovie = ({
  handleCloseModalUserMovie,
  selectedMovie,
  myMoviesPage,
}: {
  handleCloseModalUserMovie: () => void
  selectedMovie: UserMovieType
  myMoviesPage: boolean
}) => {
  const dispatch = useAppDispatch()
  // const { myMovies, publicMovies, loading, error } = useAppSelector(
  //    (state: RootState) => state.userMovies
  //  )

  const changeStatusMovie = async () => {
    try {
      await dispatch(
        toggleUserMovieStatusThunk({
          userMovieId: selectedMovie._id,
          newStatus:
            selectedMovie.status === "wantToSee" ? "watched" : "wantToSee",
        })
      )

      handleCloseModalUserMovie()
    } catch (error) {
      console.log(error)
    }
  }

  const handelDeleteUserMovie = async () => {
    try {
      await dispatch(
        deleteUserMovieThunk({
          userMovieId: selectedMovie._id,
          status:
            selectedMovie.status === "wantToSee" ? "wantToSee" : "watched",
        })
      )
      handleCloseModalUserMovie()
    } catch (error) {
      console.log(error)
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
  return (
    <div className={style.wrapper} onClick={handleCloseModalUserMovie}>
      <div className={style.container}>
        <div
          className={style.containerWrapper}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={style.headerModule}>
            <h2>{selectedMovie.title}</h2>
            <CloseButton onClick={handleCloseModalUserMovie} />
          </div>
          {/* <h3>{selectedMovie.title}</h3> */}
          <div className={style.imgAndGenreBlock}>
            <div className={style.imgBlock}>
              <Image
                src={selectedMovie.avatar}
                alt={"Avatar"}
                width={200}
                height={200}
              />
            </div>
            {selectedMovie.genres.length > 0 ? (
              <div className={style.genresBlock}>
                {selectedMovie.genres?.map((genre, index) => (
                  <div key={index}>{translatorGenres(genre)}</div>
                ))}
              </div>
            ) : null}
          </div>
          {selectedMovie.content && (
            <div className={style.descriptionBlock}>
              {selectedMovie.content}
            </div>
          )}
          {myMoviesPage && (
            <div className={style.buttonBlock}>
              <ButtonMenu
                onClick={() => {
                  changeStatusMovie()
                }}
              >
                {selectedMovie.status === "wantToSee"
                  ? "Просмотрено"
                  : "В желаемое"}
              </ButtonMenu>
              <ButtonMenu
                onClick={() => {
                  handelDeleteUserMovie()
                }}
              >
                Удалить
              </ButtonMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
// _id: string
// title: string
// genres: string[]
// avatar: string
// content?: string
// status: "wantToSee" | "watched"
// addedAt: string
