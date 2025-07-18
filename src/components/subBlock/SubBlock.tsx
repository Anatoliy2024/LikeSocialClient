import { UserType } from "@/store/thunks/usersThunk"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import style from "./SubBlock.module.scss"
import Link from "next/link"
// import { useRouter } from 'next/navigation'

export const SubBlock = ({
  subsData,
  type,
}: {
  subsData: UserType[]
  type: string
}) => {
  // const router = useRouter()
  // const handleLinkUser = (userId: string) => {
  //     router.push(`/profile/${userId}`)
  //   }
  const textControl: Record<string, string> = {
    subscriptions: "Мои подписки:",
    subscribers: "Мои подписчики:",
  }

  return (
    <div className={style.subBlock}>
      <h3>{textControl[type]}</h3>
      {subsData.map((sub) => (
        <Link key={sub._id} href={`/profile/${sub._id}`}>
          <div className={style.subPerson}>
            <div className={style.imgBlockSub}>
              <CloudinaryImage
                src={sub.avatar}
                alt="avatar"
                width={70}
                height={70}
              />
            </div>
            <div className={style.nameBlock}>{sub.username}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
