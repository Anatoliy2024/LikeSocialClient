import { UserType } from "@/store/thunks/usersThunk"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import style from "./SubBlock.module.scss"
import Link from "next/link"

import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"

export const SubBlock = ({
  subsData,
  type,
}: {
  subsData: UserType[]
  type: string
}) => {
  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)

  const textControl: Record<string, string> = {
    subscriptions: "Мои подписки:",
    subscribers: "Мои подписчики:",
  }

  return (
    <div className={style.subBlock}>
      <h3>{textControl[type]}</h3>
      <div className={style.subList}>
        {subsData.map((sub) => {
          return (
            <Link key={sub._id} href={`/profile/${sub._id}`}>
              <div className={style.subPerson}>
                <div className={style.imageBlockContainer}>
                  <div className={style.imgBlockSub}>
                    <CloudinaryImage
                      src={sub.avatar}
                      alt="avatar"
                      width={70}
                      height={70}
                    />
                  </div>
                  {usersOnline[sub._id]?.isOnline && (
                    <div className={style.onlineBlock}></div>
                  )}
                </div>
                <div className={style.nameBlock}>{sub.username}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
