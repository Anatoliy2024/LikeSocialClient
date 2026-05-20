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
  changeAvatarGroupThunk,
  deleteMemberToGroupThunk,
  fetchItemConversationThunk,
} from "@/store/thunks/conversationsThunk"
import { useEffect, useState } from "react"
import ButtonMenu from "../ui/button/Button"
import { AddMembers } from "../AddMembers/AddMembers"
import { getUserRelationsThunk } from "@/store/thunks/usersThunk"
import { RootState } from "@/store/store"
import { ChangeAvatarModal } from "../changeAvatarModal/ChangeAvatarModal"
import { useSocket } from "@/providers/SocketProvider"
import {
  delCinemaHallList,
  getAllCinemaHall,
  getCinemaHallList,
} from "@/store/slices/cinemaHallSlice"
import { CinemaHallTargetType } from "@/types/cinemaHall.types"
import { StorageTorrentManager } from "../StorageManager/StorageTorrentManager"

export function SettingsGroup() {
  const [changeAvatarGroup, setChangeAvatarGroup] = useState(false)
  const socket = useSocket()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  // const [showCinemaHallModal, setShowCinemaHallModal] = useState(false)
  const dispatch = useAppDispatch()
  const currentConversation = useAppSelector(
    (state) => state.conversations.currentConversation,
  )
  const loading = useAppSelector((state) => state.conversations.loading)
  const userId = useAppSelector((state) => state.auth.userId)
  const {
    users: friendsUsers,
    page: friendsPage,
    pages: friendsPages,
  } = useAppSelector((state: RootState) => state.users.friends)

  const cinemaHalls = useAppSelector((state) => state.cinemaHall.cinemaHalls)

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

  const LinkMovieHallRoom = (roomId: string) => {
    return `/watch/${roomId}?group=${id}`
  }
  useEffect(() => {
    dispatch(
      getUserRelationsThunk({ type: "friends", page: pageUserFriendsFromUrl }),
    )
  }, [dispatch, pageUserFriendsFromUrl])

  useEffect(() => {
    dispatch(fetchItemConversationThunk(id))
  }, [dispatch, id])

  useEffect(() => {
    if (!socket || !id) return
    socket.emit(
      "cinema-hall:get-all",
      { groupId: id },
      (data: { cinemaHallList: CinemaHallTargetType[] }) => {
        dispatch(getAllCinemaHall(data.cinemaHallList))
      },
    )

    //  socket.on("cinema-hall:get-all", async (data, callback) => {
    //       getAllCinemaHallHandler(io, socket, data, callback)
    //     })
  }, [socket, id, dispatch])

  const handleShowAddMembers = () => {
    setShowAddMemberModal(true)
  }
  const handleCloseAddMembers = () => {
    setShowAddMemberModal(false)
  }
  const handleAddMembers = async (members: string[]) => {
    try {
      const data = await dispatch(
        addMemberToGroupThunk({ conversationId: id, members }),
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
        }),
      )
    } catch (error) {
      console.log(error)
    }
  }

  const handleCloseChangeAvatarModal = () => {
    setChangeAvatarGroup(false)
  }
  const handleShowChangeAvatarModal = () => {
    setChangeAvatarGroup(true)
  }

  const handleLinkMovieHall = () => {
    const cinemaHallId = crypto.randomUUID()

    // LinkMovieHallRoom(cinemaHallId)
    router.push(LinkMovieHallRoom(cinemaHallId))
    // setShowCinemaHallModal(true)
  }
  // const handleGroupAvatarUpload=()=>{

  // }
  const handleGroupAvatarUpload = async (
    file: File,
    context?: { groupId?: string },
  ) => {
    if (!context?.groupId) return
    await dispatch(
      changeAvatarGroupThunk({ file, groupId: context.groupId }),
    ).unwrap()
  }

  useEffect(() => {
    if (!socket) return
    const handleGetNewRoom = (data: { hall: CinemaHallTargetType }) => {
      console.log("handleGetNewRoom data", data)
      dispatch(getCinemaHallList(data.hall))
    }
    const handleDellRoom = (data: { hall: string }) => {
      console.log("handleGetNewRoom data", data)
      dispatch(delCinemaHallList(data.hall))
    }
    socket.on("cinema-hall:get-new-room", handleGetNewRoom)
    socket.on("cinema-hall:dell-room", handleDellRoom)
    return () => {
      socket.off("cinema-hall:get-new-room", handleGetNewRoom)
      socket.off("cinema-hall:dell-room", handleDellRoom)
    }
  }, [socket, dispatch])

  useEffect(() => {
    if (!socket && !id) return

    socket?.emit("settings-group:join", id)
    return () => {
      socket?.emit("settings-group:leave", id)
    }
  }, [socket, dispatch, id])

  if (!currentConversation) return

  return (
    <div className={style.settingsGroup}>
      {changeAvatarGroup && (
        <ChangeAvatarModal
          handleCloseModal={handleCloseChangeAvatarModal}
          loading={loading}
          onUpload={handleGroupAvatarUpload}
          context={{ groupId: id }}
        />
      )}
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
        <div className={style.settingsGroup__avatarWrapperContainer}>
          <div
            className={style.settingsGroup__avatarWrapper}
            onClick={handleShowChangeAvatarModal}
          >
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
        <div className={style.cinemaHall}>
          <ButtonMenu onClick={handleLinkMovieHall}>
            Создать видеозал
          </ButtonMenu>
          <StorageTorrentManager />
          <div className={style.cinemaHall__list}>
            <h3>Список доступных залов:</h3>
            {cinemaHalls.length > 0 ? (
              <ul>
                {cinemaHalls.map((item) => (
                  <li
                    key={item.cinemaHallId}
                    className={style.cinemaHall__item}
                  >
                    <Link href={LinkMovieHallRoom(item.cinemaHallId as string)}>
                      <div className={style.cinemaHall__itemName}>
                        <span>Название:</span>
                        <span>{item.cinemaHallName}</span>
                      </div>
                      <div>
                        <div>
                          <span>Участники:</span>
                          <span>{item.participants.length}</span>
                        </div>
                        <div>
                          <span> Размер:</span>
                          <span>
                            {(item.file.size / 1024 / 1024 / 1024).toFixed(2)}{" "}
                            ГБ
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div>Пусто...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
