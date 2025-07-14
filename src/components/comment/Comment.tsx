import { formatData } from "@/utils/formatData"
// import Image from "next/image"
import style from "./Comment.module.scss"
import { userCommentType } from "@/store/slices/roomPostsSlice"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
export const Comment = ({ data }: { data: userCommentType }) => {
  console.log("data Comment", data)
  const { userId, text, createdAt } = data
  const { username, avatar } = userId

  return (
    <div className={style.container}>
      <div className={style.userInfoBlock}>
        <div className={style.blockImg}>
          <CloudinaryImage src={avatar} alt="avatar" width={120} height={120} />
        </div>
        <div className={style.blockName}>{username}</div>
        <div className={style.blockContent}>{text}</div>
      </div>

      <div className={style.blockData}>{formatData(createdAt)}</div>
    </div>
  )
}
