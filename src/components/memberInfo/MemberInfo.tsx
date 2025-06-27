import Image from "next/image"
import style from "./MemberInfo.module.scss"
import CloseButton from "../ui/closeButton/CloseButton"
// import { X } from "lucide-react" // иконка крестика (можно заменить на любую)
export const MemberInfo = ({
  name,
  avatar,
  id,
  delMember,
  owner,
  isOwner,
}: {
  name: string
  avatar: string
  id: string
  delMember?: (id: string) => void
  owner?: string
  isOwner?: boolean
}) => {
  console.log("MemberInfo owner", owner)
  console.log("id", id)
  const isDeleteMember =
    typeof delMember === "function" && owner !== id && isOwner
  return (
    <div className={style.wrapper}>
      <div className={style.blockImg}>
        <Image src={avatar} alt="AvatarImage" width={60} height={60} />
      </div>
      <div className={style.blockName}>{name}</div>
      {isDeleteMember && (
        <CloseButton
          onClick={() => {
            delMember(id)
          }}
          title="delete member"
          style={{
            position: "absolute",
            top: "-6px",
            right: "3px",
            width: "20px",
            height: "20px",
            fontSize: "14px",
          }}
        />
      )}
    </div>
  )
}

// {isMyPost && (
//   <CloseButton onClick={() => handleDelete(id)} title="Удалить пост" />
// )}
