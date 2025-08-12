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
  // UserMovieType,
} from "@/store/slices/userMoviesSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
// import MovieCard from "@/components/MovieCard/MovieCard"
import styles from "./MyMoviesPage.module.scss"
import ButtonMenu from "@/components/ui/button/Button"

import { ModalUserMovie } from "../modalUserMovie/modalUserMovie"
import UserMovieList from "@/components/userMovieList/UserMovieList"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import SpinnerWindow from "@/components/ui/spinner/SpinnerWindow"
import FormMovieWantToSee from "../FormMovieWantToSee/FormMovieWantToSee"

type Props =
  | { myMoviesPage: true; userId?: never }
  | { myMoviesPage?: false; userId: string }

const MyMoviesPageCommon = ({ myMoviesPage = false, userId }: Props) => {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<"wantToSee" | "watched">(
    "wantToSee"
  )
  const [isFormMovieWantToSee, setIsFormMovieWantToSee] = useState(false)

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

  const movieId = searchParams?.get("movieId")

  const selectedMovie = Array.isArray(movies)
    ? movies.find((movie) => movie._id === movieId)
    : null

  const showFormMovieWantToSee = () => {
    setIsFormMovieWantToSee(true)
    setActiveTab("wantToSee")

    console.log("setIsCreateMovieWantToSee", isFormMovieWantToSee)
  }
  const closeFormMovieWantToSee = () => {
    setIsFormMovieWantToSee(false)
    console.log("closeCreateMovieWantToSee", isFormMovieWantToSee)
  }

  const openMovieModal = (id: string, page: number) => {
    const searchParams = new URLSearchParams()
    searchParams.set("movieId", id)

    searchParams.set("page", page.toString())

    // }
    // pageRoom=2
    // console.log("searchParams", searchParams)

    const url = `/userMovie?${searchParams.toString()}`

    router.push(url, { scroll: false }) // <--- ВАЖНО!
  }
  const closeModal = () => {
    const searchParams = new URLSearchParams()

    // if (page !== 1) {

    searchParams.set("page", page.toString())

    // }

    const url = `/userMovie?${searchParams.toString()}`

    router.push(url, { scroll: false })
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
      {selectedMovie && (
        <ModalUserMovie
          closeModal={closeModal}
          selectedMovie={selectedMovie}
          myMoviesPage={myMoviesPage}
          // setSelectedMovie={setSelectedMovie}
          closeFormMovieWantToSee={closeFormMovieWantToSee}
          page={page}
        />
      )}
      {isFormMovieWantToSee && (
        <FormMovieWantToSee hiddenBlock={closeFormMovieWantToSee} />
      )}
      <div className={styles.wrapper}>
        <h1 className={styles.title}>
          {userId ? "Фильмы пользователя" : "Мои фильмы"}
        </h1>
        {myMoviesPage && (
          <div className={styles.createMovieButton}>
            <ButtonMenu onClick={showFormMovieWantToSee}>Создать</ButtonMenu>
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
          openMovieModal={openMovieModal}
          // onClickMovie={handleShowModalUserMovie}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  )
}

export default MyMoviesPageCommon
