import { formatData } from "@/utils/formatData"
import style from "./RoomCard.module.scss"
import Image from "next/image"
import { useRouter } from "next/navigation"
import ButtonMenu from "@/components/ui/button/Button"

export const RoomCard = ({ data, userId, delRoom, leaveRoom }) => {
  const {
    name,
    description,
    members,
    owner,
    imageRoom,
    createdAt,

    _id,
  } = data
  const isOwner = owner === userId
  const router = useRouter()
  const handleLinkUser = (roomId: string) => {
    router.push(`/room/${roomId}`)
    console.log("`/room/${roomId}`")
  }

  return (
    <div className={style.wrapper}>
      <div className={style.mainInfo} onClick={() => handleLinkUser(_id)}>
        <div className={style.blockImg}>
          <Image
            src={imageRoom} // путь к изображению в public
            alt="roomImage"
            width={200}
            height={200}
          />
        </div>
        <div className={style.blockInfo}>
          <h3>
            <span>Название:</span>
            <span>{name}</span>
          </h3>
          <div>
            <span>Описание:</span>
            <span>{description}</span>
          </div>
          <div>
            <span>Количество участников: </span>
            <span>{members?.length}</span>
          </div>
          <div>
            <span>Дата создания: </span>
            <span>{formatData(createdAt)}</span>
          </div>
        </div>
      </div>
      <div>
        <ButtonMenu
          onClick={() => {
            if (isOwner) {
              delRoom(_id)
            } else {
              leaveRoom(_id)
            }
          }}
        >
          {isOwner ? "Удалить" : "Выйти"}
        </ButtonMenu>
      </div>
    </div>
  )
}
