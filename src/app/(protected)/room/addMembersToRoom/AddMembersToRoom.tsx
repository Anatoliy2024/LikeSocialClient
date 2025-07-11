"use client"
import { useForm, Controller } from "react-hook-form"
import { MemberInfo } from "@/components/memberInfo/MemberInfo"
import style from "./AddMembersToRoom.module.scss"
import ButtonMenu from "@/components/ui/button/Button"
import { RoomMemberType } from "@/store/thunks/roomsThunk"
import { UserType } from "@/store/thunks/usersThunk"
import { useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import { useEffect } from "react"
import { Paginator } from "@/components/Paginator/Paginator"

type FormData = {
  selected: string[]
}
export const AddMembersToRoom = ({
  members,
  handleCloseAddMembersFromRoom,
  friends,
  onSubmitMembers, // <- функция для обработки выбранных участников
  onChangePageFriends,
  page,
  pages,
}: {
  members: RoomMemberType[]
  handleCloseAddMembersFromRoom: () => void
  friends: UserType[]
  onSubmitMembers: (members: string[]) => void
  onChangePageFriends: (newPage: number) => void
  page: number
  pages: number
}) => {
  const loading = useAppSelector((state: RootState) => state.rooms.loading)

  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: {
      selected: [], // массив id выбранных друзей
    },
  })

  const onSubmit = (data: FormData) => {
    // data.selected будет массивом id выбранных друзей
    onSubmitMembers(data.selected)
  }
  const availableFriends = friends.filter(
    (friend) => !members.some((member) => member._id === friend._id)
  )

  useEffect(() => {
    // при монтировании — запрещаем прокрутку
    document.body.style.overflow = "hidden"

    // при размонтировании — возвращаем как было
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <div className={style.wrapper} onClick={handleCloseAddMembersFromRoom}>
      <div className={style.container} onClick={(e) => e.stopPropagation()}>
        <h3>Участники</h3>
        <Paginator
          pages={pages}
          page={page}
          onPageChange={onChangePageFriends}
        />
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={style.list}>
            {availableFriends.map((friend) => (
              <div key={friend._id} className={style.member}>
                <Controller
                  name="selected"
                  control={control}
                  render={({ field }) => (
                    <label className={style.checkboxLabel}>
                      <input
                        type="checkbox"
                        value={friend._id}
                        checked={field.value.includes(friend._id)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const value = e.target.value
                          const newValue = checked
                            ? [...field.value, value]
                            : field.value.filter((id) => id !== value)
                          field.onChange(newValue)
                        }}
                      />
                      <MemberInfo
                        id={friend._id}
                        name={friend.username}
                        avatar={friend.avatar}
                      />
                    </label>
                  )}
                />
              </div>
            ))}
          </div>

          <div className={style.buttons}>
            <ButtonMenu type="submit" disabled={loading} loading={loading}>
              Добавить
            </ButtonMenu>
            <ButtonMenu type="button" onClick={handleCloseAddMembersFromRoom}>
              Отмена
            </ButtonMenu>
          </div>
        </form>
      </div>
    </div>
  )
}
