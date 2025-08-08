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
// import MovieCard from "@/components/MovieCard/MovieCard"
import styles from "./MyMoviesPage.module.scss"
import ButtonMenu from "@/components/ui/button/Button"
import CreateMovieWantToSee from "../CreateMovieWantToSee/CreateMovieWantToSee"
import { ModalUserMovie } from "../modalUserMovie/modalUserMovie"
import UserMovieList from "@/components/userMovieList/UserMovieList"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import SpinnerWindow from "@/components/ui/spinner/SpinnerWindow"

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

  const {
    myMovies,
    publicMovies,
    loading,
    error,
    page,

    pages,
  } = useAppSelector((state: RootState) => state.userMovies)
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  console.log(
    "state.userMovies*****************",
    myMovies,
    publicMovies,
    loading,
    error,
    page,

    pages
  )
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pageFromUrl = Number(searchParams?.get("page")) || 1

  // useEffect(() => {
  //   if (isAuth && typeof id === "string") {
  //     dispatch(setRoomPage(pageFromUrl))
  //     dispatch(getRoomPostsThunk({ roomId: id, page: pageFromUrl }))
  //   }
  // }, [isAuth, dispatch, id, pageFromUrl])

  // useEffect(() => {
  //   if (isAuth && typeof id === "string") {
  //     dispatch(getRoomByIdThunk(id))
  //   }
  // }, [isAuth, dispatch, id])

  useEffect(() => {
    if (isAuth) {
      dispatch(clearUserMoviesError())
      if (myMoviesPage) {
        if (activeTab === "wantToSee") {
          dispatch(fetchMyWantToSeeMoviesThunk(pageFromUrl))
        } else {
          dispatch(fetchMyWatchedMoviesThunk(pageFromUrl))
        }
      } else {
        if (!userId) return
        dispatch(clearPublicMovies())
        if (activeTab === "wantToSee") {
          dispatch(
            fetchPublicWantToSeeMoviesThunk({ userId, page: pageFromUrl })
          )
        } else {
          dispatch(fetchPublicWatchedMoviesThunk({ userId, page: pageFromUrl }))
        }
      }
    }
  }, [dispatch, userId, myMoviesPage, activeTab, isAuth, pageFromUrl])

  const movies = userId
    ? activeTab === "wantToSee"
      ? publicMovies.wantToSee
      : publicMovies.watched
    : activeTab === "wantToSee"
    ? myMovies.wantToSee
    : myMovies.watched
  console.log("movie", movies)

  // const renderMovies = () => {
  //   const movies = userId
  //     ? activeTab === "wantToSee"
  //       ? publicMovies.wantToSee
  //       : publicMovies.watched
  //     : activeTab === "wantToSee"
  //     ? myMovies.wantToSee
  //     : myMovies.watched
  //   console.log("movie", movies)

  //   if (loading) return <p>Загрузка...</p>
  //   if (error) return <p className={styles.error}>{error}</p>
  //   if (!movies?.length) return <p>Фильмов нет</p>
  //   return (
  //     <div className={styles.grid}>
  //       {pages > 1 && (
  //           <div style={{ marginTop: 20 }}>
  //             {Array.from({ length: pages }, (_, i) => i + 1).map((num) => (
  //               <button
  //                 key={num}
  //                 disabled={num === page}
  //                 onClick={() => onPageChange(num)}
  //                 style={{
  //                   marginRight: 5,
  //                   padding: "5px 10px",
  //                   fontWeight: num === page ? "bold" : "normal",
  //                   cursor: num === page ? "default" : "pointer",
  //                 }}
  //               >
  //                 {num}
  //               </button>
  //             ))}
  //           </div>
  //         )}
  //       {movies.map((movie) => (
  //         <MovieCard
  //           myMoviesPage={myMoviesPage}
  //           key={movie._id}
  //           movie={movie}
  //           onClick={() => handleShowModalUserMovie(movie)}
  //         />
  //       ))}
  //     </div>
  //   )
  // }

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

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set("page", String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })

    // dispatch(setRoomPage(newPage)) // переключаем страницу в Redux
  }

  const handleTabChange = (tab: "wantToSee" | "watched") => {
    setActiveTab(tab)

    const params = new URLSearchParams(searchParams?.toString())
    params.delete("page") // удаляем параметр страницы

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      {loading && <SpinnerWindow />}
      {showModalUserMovie && selectedMovie && (
        <ModalUserMovie
          handleCloseModalUserMovie={handleCloseModalUserMovie}
          selectedMovie={selectedMovie}
          myMoviesPage={myMoviesPage}
          setSelectedMovie={setSelectedMovie}
          page={page}
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
          <div className={styles.createMovieButton}>
            <ButtonMenu onClick={showCreateMovieWantToSee}>Создать</ButtonMenu>
          </div>
        )}

        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "wantToSee" ? styles.active : ""
            }`}
            onClick={() => handleTabChange("wantToSee")}
          >
            Хочу посмотреть
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "watched" ? styles.active : ""
            }`}
            onClick={() => handleTabChange("watched")}
          >
            Просмотрено
          </button>
        </div>

        <UserMovieList
          movies={movies}
          loading={loading}
          error={error}
          myMoviesPage={myMoviesPage}
          page={page}
          pages={pages}
          onClickMovie={handleShowModalUserMovie}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  )
}

export default MyMoviesPageCommon
