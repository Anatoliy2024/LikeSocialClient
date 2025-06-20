import { formatData } from "@/utils/formatData"
import Image from "next/image"
import style from "./Comment.module.scss"
export const Comment = ({ data }) => {
  console.log("data Comment", data)
  const { userId, text, createdAt } = data
  const { username, avatar } = userId

  return (
    <div className={style.container}>
      <div className={style.userInfoBlock}>
        <div className={style.blockImg}>
          <Image src={avatar} alt="avatar" width={40} height={40} />
        </div>
        <div className={style.blockName}>{username}</div>
        <div className={style.blockContent}>{text}</div>
      </div>

      <div className={style.blockData}>{formatData(createdAt)}</div>
    </div>
  )
}
