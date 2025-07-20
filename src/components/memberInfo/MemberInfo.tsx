"use client"
// import Image from "next/image"
import style from "./MemberInfo.module.scss"
import CloseButton from "../ui/closeButton/CloseButton"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import ConfirmModal from "../ConfirmModal/ConfirmModal"
import { useState } from "react"
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
  const [isConfirmOpen, setConfirmOpen] = useState(false)

  // console.log("MemberInfo owner", owner)
  // console.log("id", id)
  const isDeleteMember =
    typeof delMember === "function" && owner !== id && isOwner
  return (
    <>
      <div className={style.wrapper}>
        <div className={style.blockImg}>
          <CloudinaryImage
            src={avatar}
            alt="AvatarImage"
            width={120}
            height={120}
          />
        </div>
        <div className={style.blockName}>{name}</div>
        {isDeleteMember && (
          <CloseButton
            onClick={() => {
              setConfirmOpen(true)
              // delMember(id)
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
      {isDeleteMember && (
        <ConfirmModal
          isOpen={isConfirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => delMember(id)}
          title="Удалить участника?"
          message="Вы уверены, что хотите удалить этого пользователя из комнаты?"
        />
      )}
    </>
  )
}

// {isMyPost && (
//   <CloseButton onClick={() => handleDelete(id)} title="Удалить пост" />
// )}
