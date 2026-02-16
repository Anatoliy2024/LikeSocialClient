import { useEffect } from "react"
import ButtonMenu from "../ui/button/Button"
import style from "./ModalAddGroup.module.scss"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { getUserRelationsThunk } from "@/store/thunks/usersThunk"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { RootState } from "@/store/store"
// import { Paginator } from "../Paginator/Paginator"
// import { AddMembers } from "../AddMembers/AddMembers"
import { MembersSelectList } from "../MembersSelectList/MembersSelectList"
import { useForm } from "react-hook-form"

type FormData = {
  groupName: string | null
  description: string | null
  selected: string[]
}

export function ModalAddGroup({
  closeModalAddGroup,
}: {
  closeModalAddGroup: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const loading = false

  const {
    handleSubmit,
    watch,
    setValue,
    register,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      groupName: null,
      description: null,
      selected: [], // массив id выбранных друзей
    },
  })

  const dispatch = useAppDispatch()
  const selected = watch("selected")
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

  const onSubmit = (data: FormData) => {
    // data.selected будет массивом id выбранных друзей
    // onSubmitMembers(data.selected)
    console.log("data", data)
  }

  useEffect(() => {
    dispatch(
      getUserRelationsThunk({ type: "friends", page: pageUserFriendsFromUrl })
    )
  }, [, dispatch, pageUserFriendsFromUrl])
  return (
    <div className={style.modalAddGroup}>
      <div className={style.modalAddGroup__wrapper}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={style.modalAddGroup__form}
        >
          <div className={style.modalAddGroup__inputWrapper}>
            <label htmlFor="group-name">Название группы</label>

            <input
              id="group-name"
              placeholder="Введите название"
              {...register("groupName", {
                required: "Укажите название",
              })} // custom message
            />
          </div>
          {errors.groupName && (
            <span className={style.modalAddGroup__error}>
              {errors.groupName.message}
            </span>
          )}
          <div className={style.modalAddGroup__inputWrapper}>
            <label htmlFor="group-description">Описание: </label>

            <textarea
              placeholder="Введите описание..."
              id="group-description"
              {...register("description")} // custom message
            />
          </div>

          <MembersSelectList
            friends={friendsUsers}
            selected={selected}
            onChange={(ids) => setValue("selected", ids)}
            pages={friendsPages}
            onPageChange={handlePageChange}
            page={friendsPage}
          />

          <div className={style.modalAddGroup__buttonBlock}>
            <div className={style.modalAddGroup__button}>
              <ButtonMenu type="submit" disabled={loading} loading={loading}>
                Создать
              </ButtonMenu>
            </div>
            <div className={style.modalAddGroup__button}>
              <ButtonMenu type="button" onClick={closeModalAddGroup}>
                Отмена
              </ButtonMenu>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
