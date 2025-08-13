"use client"
import { UserMovieType } from "@/store/slices/userMoviesSlice"
import style from "./modalUserMovie.module.scss"
// import Image from "next/image"
import ButtonMenu from "@/components/ui/button/Button"
import { translatorGenres } from "@/utils/translatorGenres"
import { useEffect, useState } from "react"
import CloseButton from "@/components/ui/closeButton/CloseButton"
import {
  createUserMovieType,
  deleteUserMovieThunk,
  toggleUserMovieStatusThunk,
  // uploadUserMovieAvatarThunk,
} from "@/store/thunks/userMoviesThunk"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
// import { ChangeAvatarModal } from "@/components/changeAvatarModal/ChangeAvatarModal"
import { CloudinaryImage } from "@/components/CloudinaryImage/CloudinaryImage"
import FormMovieWantToSee from "../FormMovieWantToSee/FormMovieWantToSee"
import { Edit } from "@/assets/icons/edit"
import PostForm, { FormCreatePost } from "@/components/postForm/PostForm"
import { ModalLocation } from "../modalLocation/modalLocation"
export const ModalUserMovie = ({
  // handleCloseModalUserMovie,
  selectedMovie,
  myMoviesPage,
  // setSelectedMovie,
  page,
  closeModal,
}: // closeFormMovieWantToSee,
{
  // handleCloseModalUserMovie: () => void
  closeFormMovieWantToSee: () => void

  selectedMovie: UserMovieType
  myMoviesPage: boolean
  closeModal: () => void
  // setSelectedMovie: (movie: UserMovieType) => void
  page: number
}) => {
  const dispatch = useAppDispatch()
  const [editPost, setEditPost] = useState(false)
  // const [createPost, setCreatePost] = useState(false)
  const [modalLocation, setModalLocation] = useState(false)
  const [location, setLocation] = useState<null | string>(null)
  const loading = useAppSelector((state: RootState) => state.userMovies.loading)
  console.log("loading", loading)

  const changeStatusMovie = async () => {
    try {
      await dispatch(
        toggleUserMovieStatusThunk({
          userMovieId: selectedMovie._id,
          newStatus:
            selectedMovie.status === "wantToSee" ? "watched" : "wantToSee",
          page,
        })
      )

      closeModal()
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
          page,
        })
      )
      closeModal()
    } catch (error) {
      console.log(error)
    }
  }
  const showEditPost = () => {
    setEditPost(true)
  }
  const closeEditPost = () => {
    setEditPost(false)
  }

  useEffect(() => {
    // при монтировании — запрещаем прокрутку
    document.body.style.overflow = "hidden"

    // при размонтировании — возвращаем как было
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  function adaptMoviePostToEditForm(movie: UserMovieType): createUserMovieType {
    return {
      title: movie.title || "",
      content: movie.content || "",
      // roomId: post.roomId || null,
      genres: movie.genres || [],
      status: movie.status || null,
      // stars: post.ratings?.stars || 0,
      // acting: post.ratings?.acting || 0,
      // specialEffects: post.ratings?.specialEffects || 0,
      // story: post.ratings?.story || 0,
      avatarFile: null, // потому что файл ты не можешь "вернуть обратно" — он только при загрузке
      imageId: movie.imageId,
      _id: movie._id || "",
    }
  }

  const showModalLocation = () => {
    setModalLocation(true)
  }
  const closeModalLocation = () => {
    setModalLocation(false)
  }
  const changeLocation = (location: string) => {
    setLocation(location)
    closeModalLocation()
  }

  function adaptMoviePostToCreateForm(movie: UserMovieType): FormCreatePost {
    return {
      title: movie.title,
      content: "",
      roomId: location && location !== "profile" ? location : null,
      genres: movie.genres || [],
      stars: 0,
      acting: 0,
      specialEffects: 0,
      story: 0,
      avatarFile: null, // потому что файл ты не можешь "вернуть обратно" — он только при загрузке
      // avatar: post.imageId?.url || "",
      imageId: movie.imageId,
      // _id: post._id || "",
    }
  }

  return (
    <>
      {myMoviesPage && editPost && (
        <FormMovieWantToSee
          hiddenBlock={closeEditPost}
          editMode={true}
          initialData={adaptMoviePostToEditForm(selectedMovie)}
        />
      )}
      {myMoviesPage && location && (
        <PostForm
          hiddenBlock={() => {
            closeModal()
            setLocation(null)
          }}
          isProfile={location === "profile"}
          roomId={location !== "profile" ? location : null}
          editMode={false}
          initialData={adaptMoviePostToCreateForm(selectedMovie)}
        />
      )}
      {myMoviesPage && modalLocation && (
        <ModalLocation
          hiddenBlock={closeModalLocation}
          changeLocation={changeLocation}
        />
      )}

      <div className={style.wrapper} onClick={closeModal}>
        <div className={style.container}>
          <div
            className={style.containerWrapper}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={style.headerModule}>
              <div className={style.titleBlock}>{selectedMovie.title}</div>
              <div className={style.titleButtonBlock}>
                {myMoviesPage && (
                  <div className={style.buttonBlockEdit} onClick={showEditPost}>
                    <Edit />
                  </div>
                )}
                <CloseButton onClick={closeModal} />
              </div>
            </div>
            {/* <h3>{selectedMovie.title}</h3> */}
            <div className={style.imgAndGenreBlock}>
              <div
                className={style.imgBlock}
                // onClick={handleOpenModal}
              >
                <CloudinaryImage
                  src={selectedMovie.imageId?.url || "/images/monkey.jpg"}
                  alt={"Avatar"}
                  width={600}
                  height={600}
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
                <ButtonMenu onClick={showModalLocation}>
                  Опубликовать
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
    </>
  )
}
