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
} from "@/store/slices/userMoviesSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import MovieCard from "@/components/MovieCard/MovieCard"
import styles from "./MyMoviesPage.module.scss"
import ButtonMenu from "@/components/ui/button/Button"
import CreateMovieWantToSee from "../CreateMovieWantToSee/CreateMovieWantToSee"

type Props =
  | { MyMoviesPage: true; userId?: never }
  | { MyMoviesPage?: false; userId: string }

const MyMoviesPageCommon = ({ MyMoviesPage = false, userId }: Props) => {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<"wantToSee" | "watched">(
    "wantToSee"
  )
  const [isCreateMovieWantToSee, setIsCreateMovieWantToSee] = useState(false)
  // const { id: userId } = useParams()

  const { myMovies, publicMovies, loading, error } = useAppSelector(
    (state: RootState) => state.userMovies
  )

  useEffect(() => {
    dispatch(clearUserMoviesError())
    if (MyMoviesPage) {
      dispatch(fetchMyWantToSeeMoviesThunk())
      dispatch(fetchMyWatchedMoviesThunk())
    } else {
      if (!userId) return
      dispatch(clearPublicMovies())
      dispatch(fetchPublicWantToSeeMoviesThunk(userId))
      dispatch(fetchPublicWatchedMoviesThunk(userId))
    }
  }, [dispatch, userId])

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
    if (!movies.length) return <p>Фильмов нет</p>
    return (
      <div className={styles.grid}>
        {movies.map((movie) => (
          <MovieCard key={movie._id} movie={movie} />
        ))}
      </div>
    )
  }

  const showCreateMovieWantToSee = () => {
    setIsCreateMovieWantToSee(true)
    console.log("setIsCreateMovieWantToSee", isCreateMovieWantToSee)
  }
  const closeCreateMovieWantToSee = () => {
    setIsCreateMovieWantToSee(false)
    console.log("closeCreateMovieWantToSee", isCreateMovieWantToSee)
  }

  return (
    <>
      {isCreateMovieWantToSee && (
        <CreateMovieWantToSee
          closeCreateMovieWantToSee={closeCreateMovieWantToSee}
        />
      )}
      <div className={styles.wrapper}>
        <h1 className={styles.title}>
          {userId ? "Фильмы пользователя" : "Мои фильмы"}
        </h1>
        {MyMoviesPage && (
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
