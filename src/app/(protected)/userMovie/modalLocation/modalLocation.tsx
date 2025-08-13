import ButtonMenu from "@/components/ui/button/Button"
import style from "./modalLocation.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { useEffect, useState } from "react"
import { getRoomsThunk } from "@/store/thunks/roomsThunk"
import { Paginator } from "@/components/Paginator/Paginator"
import { CloudinaryImage } from "@/components/CloudinaryImage/CloudinaryImage"
export const ModalLocation = ({
  hiddenBlock,
  changeLocation,
}: {
  hiddenBlock: () => void
  changeLocation: (location: string) => void
}) => {
  const [pageCount, setPageCount] = useState(1)
  const dispatch = useAppDispatch()
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const avatar = useAppSelector((state: RootState) => state.auth.avatar)

  const { rooms, pages, page } = useAppSelector(
    (state: RootState) => state.rooms
  )

  useEffect(() => {
    dispatch(getRoomsThunk(pageCount))
  }, [isAuth, dispatch, pageCount])
  // useEffect(()=>{
  //     if(isAuth){
  //         dispatch()

  //     }
  // },[isAuth,dispatch])
  return (
    <div className={style.wrapper} onClick={hiddenBlock}>
      <div className={style.container} onClick={(e) => e.stopPropagation()}>
        <h2>Куда опубликовать?</h2>
        <div className={style.profileBlockWrapper}>
          <div>Мой профиль:</div>
          <div className={style.profileBlock}>
            <div
              className={style.blockImg}
              onClick={() => {
                changeLocation("profile")
              }}
            >
              <CloudinaryImage
                src={avatar ? avatar : ""} // путь к изображению в public
                alt="avatarUser"
                width={200}
                height={200}
              />
            </div>
          </div>
        </div>
        <div className={style.roomBlockWrapper}>
          <div>Мои комнаты:</div>
          {pages > 1 && (
            <Paginator pages={pages} onPageChange={setPageCount} page={page} />
          )}
          <div className={style.roomsBlock}>
            {rooms.map((room) => (
              <div
                key={room._id}
                className={style.roomBlock}
                onClick={() => {
                  if (room._id) {
                    changeLocation(room._id)
                  }
                }}
              >
                <div className={style.blockImg}>
                  <CloudinaryImage
                    src={room.avatar} // путь к изображению в public
                    alt="roomImage"
                    width={200}
                    height={200}
                  />
                </div>
                <div>{room.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={style.buttonBlock}>
          {/* <ButtonMenu>Выбрать</ButtonMenu> */}
          <ButtonMenu onClick={hiddenBlock}>Отмена</ButtonMenu>
        </div>
      </div>
    </div>
  )
}
