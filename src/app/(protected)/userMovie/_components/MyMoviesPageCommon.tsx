import { useEffect, useState } from "react"
// import { useParams } from "react-router-dom"
import {
  fetchMyWantToSeeMoviesThunk,
  fetchMyWatchedMoviesThunk,
  fetchPublicWantToSeeMoviesThunk,
  fetchPublicWatchedMoviesThunk,
} from "@/store/thunks/userMoviesThunk"
import {
  clearUserMoviesError,
  clearPublicMovies,
  UserMovieType,
} from "@/store/slices/userMoviesSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import MovieCard from "@/components/MovieCard/MovieCard"
import styles from "./MyMoviesPage.module.scss"
import ButtonMenu from "@/components/ui/button/Button"
import CreateMovieWantToSee from "../CreateMovieWantToSee/CreateMovieWantToSee"
import { ModalUserMovie } from "../modalUserMovie/modalUserMovie"

type Props =
  | { myMoviesPage: true; userId?: never }
  | { myMoviesPage?: false; userId: string }

const MyMoviesPageCommon = ({ myMoviesPage = false, userId }: Props) => {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<"wantToSee" | "watched">(
    "wantToSee"
  )
  const [isCreateMovieWantToSee, setIsCreateMovieWantToSee] = useState(false)
  const [showModalUserMovie, setShowModalUserMovie] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<UserMovieType | null>(null)

  // const { id: userId } = useParams()

  const { myMovies, publicMovies, loading, error } = useAppSelector(
    (state: RootState) => state.userMovies
  )

  useEffect(() => {
    dispatch(clearUserMoviesError())
    if (myMoviesPage) {
      if (activeTab === "wantToSee") {
        dispatch(fetchMyWantToSeeMoviesThunk())
      } else {
        dispatch(fetchMyWatchedMoviesThunk())
      }
    } else {
      if (!userId) return
      dispatch(clearPublicMovies())
      if (activeTab === "wantToSee") {
        dispatch(fetchPublicWantToSeeMoviesThunk(userId))
      } else {
        dispatch(fetchPublicWatchedMoviesThunk(userId))
      }
    }
  }, [dispatch, userId, myMoviesPage, activeTab])

  const renderMovies = () => {
    const movies = userId
      ? activeTab === "wantToSee"
        ? publicMovies.wantToSee
        : publicMovies.watched
      : activeTab === "wantToSee"
      ? myMovies.wantToSee
      : myMovies.watched
    console.log("movie", movies)

    if (loading) return <p>Загрузка...</p>
    if (error) return <p className={styles.error}>{error}</p>
    if (!movies?.length) return <p>Фильмов нет</p>
    return (
      <div className={styles.grid}>
        {movies.map((movie) => (
          <MovieCard
            key={movie._id}
            movie={movie}
            onClick={() => handleShowModalUserMovie(movie)}
          />
        ))}
      </div>
    )
  }

  const showCreateMovieWantToSee = () => {
    setIsCreateMovieWantToSee(true)
    setActiveTab("wantToSee")

    console.log("setIsCreateMovieWantToSee", isCreateMovieWantToSee)
  }
  const closeCreateMovieWantToSee = () => {
    setIsCreateMovieWantToSee(false)
    console.log("closeCreateMovieWantToSee", isCreateMovieWantToSee)
  }
  const handleShowModalUserMovie = (movie: UserMovieType) => {
    setSelectedMovie(movie)
    setShowModalUserMovie(true)
    // console.log("setIsCreateMovieWantToSee", isCreateMovieWantToSee)
  }
  const handleCloseModalUserMovie = () => {
    setShowModalUserMovie(false)
    setSelectedMovie(null)
    // console.log("closeCreateMovieWantToSee", isCreateMovieWantToSee)
  }

  return (
    <>
      {showModalUserMovie && selectedMovie && (
        <ModalUserMovie
          handleCloseModalUserMovie={handleCloseModalUserMovie}
          selectedMovie={selectedMovie}
          myMoviesPage={myMoviesPage}
        />
      )}
      {isCreateMovieWantToSee && (
        <CreateMovieWantToSee
          closeCreateMovieWantToSee={closeCreateMovieWantToSee}
        />
      )}
      <div className={styles.wrapper}>
        <h1 className={styles.title}>
          {userId ? "Фильмы пользователя" : "Мои фильмы"}
        </h1>
        {myMoviesPage && (
          <div>
            <ButtonMenu onClick={showCreateMovieWantToSee}>Создать</ButtonMenu>
          </div>
        )}

        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "wantToSee" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("wantToSee")}
          >
            Хочу посмотреть
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "watched" ? styles.active : ""
            }`}
            onClick={() => setActiveTab("watched")}
          >
            Просмотрено
          </button>
        </div>

        {renderMovies()}
      </div>
    </>
  )
}

export default MyMoviesPageCommon
