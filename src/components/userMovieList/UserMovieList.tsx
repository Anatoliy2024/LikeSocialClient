// components/UserMovieList/UserMovieList.tsx
import { UserMovieType } from "@/store/slices/userMoviesSlice"
import MovieCard from "../MovieCard/MovieCard"
import style from "./UserMovieList.module.scss"
import { Paginator } from "../Paginator/Paginator"
type Props = {
  movies: UserMovieType[]
  loading: boolean
  error: string | null
  openMovieModal: (id: string, page: number) => void
  // onClickMovie: (movie: UserMovieType) => void
  myMoviesPage: boolean
  page: number
  pages: number
  onPageChange: (page: number) => void
}

const UserMovieList = ({
  movies,
  loading,
  error,
  openMovieModal,
  myMoviesPage,
  page,
  pages,
  onPageChange,
}: Props) => {
  if (loading) return <p>Загрузка...</p>
  if (error) return <p className={style.error}>{error}</p>
  if (!movies?.length) return <p>Фильмов нет</p>
  console.log("pages", pages)
  return (
    <div className={style.container}>
      {pages > 1 && (
        <Paginator pages={pages} onPageChange={onPageChange} page={page} />
      )}
      <div className={style.grid}>
        {movies.map((movie) => (
          <MovieCard
            key={movie._id}
            movie={movie}
            myMoviesPage={myMoviesPage}
            onClick={() => openMovieModal(movie._id, page)}
          />
        ))}
      </div>
    </div>
  )
}

export default UserMovieList
