"use client"
// import { formatData } from "@/utils/formatData"
import style from "./RoomCard.module.scss"
// import Image from "next/image"
import { useRouter } from "next/navigation"
// import ButtonMenu from "@/components/ui/button/Button"
import { RoomType } from "@/store/thunks/roomsThunk"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import ConfirmModal from "../ConfirmModal/ConfirmModal"
import { useState } from "react"
import { People } from "@/assets/icons/people"
import { Exit } from "@/assets/icons/exit"
import { Trash } from "@/assets/icons/trash"
import Spinner from "../ui/spinner/Spinner"

export const RoomCard = ({
  data,
  userId,
  delRoom,
  leaveRoom,
}: {
  data: RoomType
  userId: string
  delRoom: (_id: string) => void
  leaveRoom: (_id: string) => void
}) => {
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  const {
    name,
    description,
    members,
    owner,
    avatar,
    // createdAt,

    _id,
  } = data
  const loading = useAppSelector((state: RootState) => state.rooms.loading)

  const isOwner = owner === userId
  const router = useRouter()
  const handleLinkUser = (roomId: string) => {
    router.push(`/room/${roomId}`)
    // console.log("`/room/${roomId}`")
  }
  if (!_id) return <div>нет id</div>

  return (
    <>
      <div className={style.wrapper}>
        <div className={style.mainInfo} onClick={() => handleLinkUser(_id)}>
          <div className={style.blockImg}>
            <CloudinaryImage
              src={avatar} // путь к изображению в public
              alt="roomImage"
              width={600}
              height={600}
            />
          </div>
          <div className={style.blockInfo}>
            <div>
              <span>Название:</span>
              <span className={style.blockInfoContent}>{name}</span>
            </div>
            <div>
              <span>Описание:</span>
              <span className={style.blockInfoContent}>{description}</span>
            </div>
            <div>
              <People />:<span>{members?.length}</span>
            </div>
            {/* <div>
              <span>Дата создания: </span>
              <span>{formatData(createdAt)}</span>
            </div> */}
          </div>
        </div>
        <div
          className={style.buttonBlock}
          onClick={() => {
            setConfirmOpen(true)
            // if (isOwner) {
            //   delRoom(_id)
            // } else {
            //   leaveRoom(_id)
            // }
          }}
        >
          {isOwner && !loading && <Trash />}
          {!isOwner && !loading && <Exit />}
          {loading && <Spinner />}
          {/* <ButtonMenu
            disabled={loading}
            loading={loading}
            onClick={() => {
              setConfirmOpen(true)
              // if (isOwner) {
              //   delRoom(_id)
              // } else {
              //   leaveRoom(_id)
              // }
            }}
          >
            {isOwner ? "Удалить" : "Выйти"}
          </ButtonMenu> */}
        </div>
      </div>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (isOwner) {
            delRoom(_id)
          } else {
            leaveRoom(_id)
          }
        }}
        title={isOwner ? "Удалить комнату" : "Выйти из комнаты"}
        message="Вы уверены? Это действие нельзя отменить."
      />
    </>
  )
}
