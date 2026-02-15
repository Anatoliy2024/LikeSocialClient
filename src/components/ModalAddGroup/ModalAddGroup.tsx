import { useEffect } from "react"
import ButtonMenu from "../ui/button/Button"
import style from "./ModalAddGroup.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getUserRelationsThunk } from "@/store/thunks/usersThunk"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { RootState } from "@/store/store"
import { Paginator } from "../Paginator/Paginator"

export function ModalAddGroup({
  closeModalAddGroup,
}: {
  closeModalAddGroup: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const dispatch = useAppDispatch()

  const {
    users: friendsUsers,
    page: friendsPage,

    pages: friendsPages,
  } = useAppSelector((state: RootState) => state.users.friends)

  const pageUserFriendsFromUrl =
    Number(searchParams?.get("pageUserFriends")) || 1

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set("pageUserFriends", String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    dispatch(
      getUserRelationsThunk({ type: "friends", page: pageUserFriendsFromUrl })
    )
  }, [, dispatch, pageUserFriendsFromUrl])
  return (
    <div className={style.modalAddGroup}>
      <div className={style.modalAddGroup__wrapper}>
        <div>
          <input type="text" id="group-name" />
          <label htmlFor="group-name">Название группы</label>
        </div>
        <div>
          {friendsUsers.length > 0 &&
            friendsUsers.map((user, i) => <div key={i}>{user.username}</div>)}
          {friendsPages > 1 && (
            <Paginator
              pages={friendsPages}
              onPageChange={handlePageChange}
              page={friendsPage}
            />
          )}
        </div>

        <div className={style.buttonBlock}>
          <ButtonMenu
            onClick={() => {
              // closeModalAddGroup()
              console.log("Группа создана")
              // dispatch(createRoomThunk(name))
            }}
          >
            Создать
          </ButtonMenu>
        </div>
        <div className={style.buttonBlock}>
          <ButtonMenu
            onClick={() => {
              closeModalAddGroup()
              // dispatch(createRoomThunk(name))
            }}
          >
            Отмена
          </ButtonMenu>
        </div>
      </div>
    </div>
  )
}
