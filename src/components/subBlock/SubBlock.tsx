import { UserType } from "@/store/thunks/usersThunk"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import style from "./SubBlock.module.scss"
import Link from "next/link"
import { OnlineStatusState } from "@/store/slices/onlineStatusSlice"
// import { useRouter } from 'next/navigation'

export const SubBlock = ({
  subsData,
  type,
  usersOnline,
}: {
  subsData: UserType[]
  type: string
  usersOnline: OnlineStatusState
}) => {
  // const router = useRouter()
  // const handleLinkUser = (userId: string) => {
  //     router.push(`/profile/${userId}`)
  //   }
  const textControl: Record<string, string> = {
    subscriptions: "Мои подписки:",
    subscribers: "Мои подписчики:",
  }
  // console.log("usersOnline", usersOnline)
  return (
    <div className={style.subBlock}>
      <h3>{textControl[type]}</h3>
      {subsData.map((sub) => {
        // console.log(
        //   "usersOnline[sub._id]?.isOnline",
        //   usersOnline[sub._id]?.isOnline
        // )
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
  )
}
