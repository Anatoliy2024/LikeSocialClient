"use client"

import { MemberInfo } from "@/components/memberInfo/MemberInfo"
import style from "./MembersSelectList.module.scss"
import { UserType } from "@/store/thunks/usersThunk"
import { Paginator } from "../Paginator/Paginator"

type Props = {
  friends: UserType[]
  selected: string[]
  onChange: (ids: string[]) => void
  pages: number
  onPageChange: (num: number) => void
  page: number
}

export const MembersSelectList = ({
  friends,
  selected,
  onChange,
  pages,
  onPageChange,
  page,
}: Props) => {
  const toggleUser = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div>
      <h3>Добавить участников:</h3>
      <div className={style.list}>
        {friends.length > 0 ? (
          friends.map((friend) => (
            <div key={friend._id} className={style.member}>
              <label className={style.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selected.includes(friend._id)}
                  onChange={() => toggleUser(friend._id)}
                />
                <MemberInfo
                  id={friend._id}
                  name={friend.username}
                  avatar={friend.avatar}
                />
              </label>
            </div>
          ))
        ) : (
          <div>Примите в друзья для добавления</div>
        )}
      </div>
      {pages > 1 && (
        <Paginator pages={pages} onPageChange={onPageChange} page={page} />
      )}
    </div>
  )
}

// pages
// onPageChange
// page
// {friendsUsers.length > 0 &&
//   friendsUsers.map((user, i) => <div key={i}>{user.username}</div>)}
// {friendsPages > 1 && (
//   <Paginator
//     pages={friendsPages}
//     onPageChange={handlePageChange}
//     page={friendsPage}
//   />
// )}
