// import { formatData } from "@/utils/formatData"
// import Image from "next/image"
import style from "./Comment.module.scss"
import { userCommentType } from "@/store/slices/roomPostsSlice"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
// import Link from "next/link"
import { ProfileLink } from "../ProfileLink/ProfileLink"
import { formatMessageTime } from "@/utils/formatMessageTime"
export const Comment = ({
  data,
  playerId,
}: {
  data: userCommentType
  playerId: string
}) => {
  console.log("data Comment", data)
  const { userId, text, createdAt } = data
  const { username, avatar } = userId

  return (
    <div className={style.container}>
      <div className={style.userInfoBlock}>
        <ProfileLink userId={userId._id} currentUserId={playerId}>
          <div className={style.avatarBlock}>
            <div className={style.blockImg}>
              <CloudinaryImage
                src={avatar}
                alt="avatar"
                width={120}
                height={120}
              />
            </div>
            <div className={style.blockName}>{username}</div>
          </div>
        </ProfileLink>
        {/* <Link href={`/profile/${userId._id}`}>
          <div className={style.avatarBlock}>
            <div className={style.blockImg}>
              <CloudinaryImage
                src={avatar}
                alt="avatar"
                width={120}
                height={120}
              />
            </div>
            <div className={style.blockName}>{username}</div>
          </div>
        </Link> */}
      </div>
      <div className={style.commentContentBlock}>
        {" "}
        <div className={style.blockContent}>{text}</div>
        <div className={style.blockData}>{formatMessageTime(createdAt)}</div>
      </div>
    </div>
  )
}
