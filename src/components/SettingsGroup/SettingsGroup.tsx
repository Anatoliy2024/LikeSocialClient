"use client"
import Link from "next/link"
import style from "./SettingsGroup.module.scss"
import {
  useParams,
  usePathname,
  useSearchParams,
  useRouter,
} from "next/navigation"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  addMemberToGroupThunk,
  deleteMemberToGroupThunk,
  fetchItemConversationThunk,
} from "@/store/thunks/conversationsThunk"
import { useEffect, useState } from "react"
import ButtonMenu from "../ui/button/Button"
import { AddMembers } from "../AddMembers/AddMembers"
import { getUserRelationsThunk } from "@/store/thunks/usersThunk"
import { RootState } from "@/store/store"

export function SettingsGroup() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const dispatch = useAppDispatch()
  const currentConversation = useAppSelector(
    (state) => state.conversations.currentConversation
  )
  const userId = useAppSelector((state) => state.auth.userId)
  const {
    users: friendsUsers,
    page: friendsPage,
    pages: friendsPages,
  } = useAppSelector((state: RootState) => state.users.friends)

  const params = useParams<{ id: string }>()
  const pageUserFriendsFromUrl =
    Number(searchParams?.get("pageUserFriends")) || 1
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set("pageUserFriends", String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  if (!params || !params.id) throw new Error("Параметр id не найден")
  const id = params.id

  useEffect(() => {
    dispatch(
      getUserRelationsThunk({ type: "friends", page: pageUserFriendsFromUrl })
    )
  }, [dispatch, pageUserFriendsFromUrl])

  useEffect(() => {
    dispatch(fetchItemConversationThunk(id))
  }, [dispatch, id])

  const handleShowAddMembers = () => {
    setShowAddMemberModal(true)
  }
  const handleCloseAddMembers = () => {
    setShowAddMemberModal(false)
  }
  const handleAddMembers = async (members: string[]) => {
    try {
      const data = await dispatch(
        addMemberToGroupThunk({ conversationId: id, members })
      )
      console.log("data handleAddMembers", data)
    } catch (error) {
      console.log(error)
    } finally {
      handleCloseAddMembers()
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!currentConversation) return
    try {
      dispatch(
        deleteMemberToGroupThunk({
          conversationId: currentConversation._id,
          memberId,
        })
      )
    } catch (error) {
      console.log(error)
    }
  }
  if (!currentConversation) return

  return (
    <div className={style.settingsGroup}>
      {showAddMemberModal && (
        <AddMembers
          members={currentConversation.members.map((member) => member.user)}
          handleCloseAddMembers={handleCloseAddMembers}
          friends={friendsUsers}
          onSubmitMembers={handleAddMembers}
          onChangePageFriends={handlePageChange}
          page={friendsPage}
          pages={friendsPages}
        />
      )}
      <h1>Option Group</h1>

      <Link
        href={`/conversation/${id}`}
        className={style.settingsGroup__buttonBack}
      >
        Back
      </Link>
      <div className={style.settingsGroup__content}>
        <div>
          <div className={style.settingsGroup__avatarWrapper}>
            <CloudinaryImage
              src={currentConversation.avatar}
              alt="avatar"
              width={600}
              height={600}
            />
          </div>
          {userId === currentConversation.owner && (
            <ButtonMenu onClick={handleShowAddMembers}>Add members</ButtonMenu>
          )}
        </div>
        <div className={style.settingsGroup__groupInfo}>
          <div className={style.settingsGroup__groupInfoName}>
            <span>Group name: </span>
            <span>{currentConversation.title}</span>
          </div>
          {currentConversation.description && (
            <div className={style.settingsGroup__groupInfoDescription}>
              <span>Description: </span>
              <span>{currentConversation.description}</span>
            </div>
          )}
          <div className={style.settingsGroup__groupInfoMembers}>
            <span>Members</span>
            <ul>
              {currentConversation.members.map((el) => (
                <li key={el.user._id}>
                  <div>
                    <Link
                      href={`/profile/${el.user._id}`}
                      className={style.settingsGroup__memberAvatarWrapper}
                    >
                      <CloudinaryImage
                        src={el.user.avatar}
                        alt="avatar"
                        width={200}
                        height={200}
                      />
                    </Link>
                    <span>{el.user.username}</span>
                  </div>

                  <div
                    className={style.settingsGroup__delMember}
                    onClick={() => handleDeleteMember(el.user._id)}
                  >
                    X
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
// _id: string
//   type: "private" | "group"
//   title: string // для групп
//   avatar: string // для групп
//   members: MemberFullType[]
//   lastMessageId?: MessageType
//   updatedAt: string

//user
// _id: string
//   username: string
//   avatar: string
