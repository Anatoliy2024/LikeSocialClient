"use client"
import { useEffect, useState } from "react"
import style from "./ProfileBlock.module.scss"
import { useForm } from "react-hook-form"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  changeAvatarUserThunk,
  changeMyProfileThunk,
  getMyProfileThunk,
  getUserProfileThunk,
} from "@/store/thunks/profileThunk"
import ButtonMenu from "@/components/ui/button/Button"
import { RootState } from "@/store/store"
// import Image from "next/image"
import { getAgeFromBirthDate } from "@/utils/getAge"
import { ChangeAvatarModal } from "@/components/changeAvatarModal/ChangeAvatarModal"
import Link from "next/link"
import {
  subscribeToUserThunk,
  unsubscribeFromUserThunk,
} from "@/store/thunks/profileThunk"
import { clearProfile } from "@/store/slices/profileSlice"
import { CloudinaryImage } from "@/components/CloudinaryImage/CloudinaryImage"
import { SubBlock } from "@/components/subBlock/SubBlock"
import { formatData } from "@/utils/formatData"
import { CreateUserMessageModal } from "@/components/createUserMessageModal/CreateUserMessageModal"
import { UnSubButton } from "@/assets/icons/unSubButton"
import { SubButton } from "@/assets/icons/subButton"
// import { SendMessage } from "@/assets/icons/sendMessage"
import { MessageText } from "@/assets/icons/messageText"
import { StarButton } from "@/assets/icons/starButton"
// import { Trash } from "@/assets/icons/trash"
import { ButtonUserStatus } from "@/components/buttonUserStatus/ButtonUserStatus"
import { getUserStatusThunk } from "@/store/thunks/usersThunk"
// import { getSocket } from "@/lib/socket"
// import { startCall } from "@/store/slices/callSlice"
// import { useCall } from "@/hooks/useCall"
import { useCallContext } from "@/providers/CallContext"
// import { startCall } from "@/store/slices/callSlice"
// import { FixedSizeCloudinaryImage } from "@/components/CloudinaryImage/CloudinaryImage"

type FormProfileInfo = {
  name: string
  sureName: string
  status: string
  birthDate: string
  country: string
  city: string
  relationshipStatus: string
}

const ProfileBlock = ({
  isMyProfilePage,
  userId,
}: {
  isMyProfilePage: boolean
  userId: string | undefined
}) => {
  const [isEdit, setIsEdit] = useState(false)
  const [changeAvatarModal, setChangeAvatarModal] = useState(false)
  const [showModalCreateMessage, setShowModalCreateMessage] = useState(false)
  // const playerId = useAppSelector((state: RootState) => state.auth.userId)

  // const { callStart } = useCall(playerId)
  const { callStart } = useCallContext()
  // const birthDate = watch("birthDate")
  // isMyProfilePage={isMyProfilePage} userId={userId}
  const dispatch = useAppDispatch()

  const profileData = useAppSelector((state: RootState) => state.profile)
  const profileLastSeen = useAppSelector(
    (state: RootState) => state.profile.lastSeen
  )
  const friendshipStatus = useAppSelector(
    (state: RootState) => state.users.friendshipStatus
  )

  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const username = useAppSelector(
    (state: RootState) => state.auth.username
  ) as string
  const avatar = useAppSelector(
    (state: RootState) => state.auth.avatar
  ) as string
  // const playerId = useAppSelector((state: RootState) => state.auth.userId)
  const loading = useAppSelector(
    (state: RootState) => state.profile.profileLoading
  )
  const usersOnline = useAppSelector((state: RootState) => state.onlineStatus)
  const status = !isMyProfilePage
    ? usersOnline[userId as string]
    : { isOnline: true, lastSeen: null }

  const lastSeen = status?.isOnline ? null : status?.lastSeen ?? profileLastSeen

  console.log("lastSeen************", lastSeen)
  const {
    register,
    handleSubmit,

    formState: { errors },
    reset,
  } = useForm<FormProfileInfo>()
  useEffect(() => {
    if (!isAuth) return
    if (isAuth) {
      dispatch(clearProfile())
      if (isMyProfilePage) {
        dispatch(getMyProfileThunk())
      } else if (userId) {
        Promise.all([
          dispatch(getUserProfileThunk(userId)),
          dispatch(getUserStatusThunk(userId)),
        ])
      }
    }
  }, [isMyProfilePage, userId, isAuth, dispatch])
  // console.log("profileData", profileData)

  const handleEditClick = () => {
    setIsEdit(true)
    reset({
      name: profileData.name || "",
      sureName: profileData.sureName || "",
      status: profileData.status || "",
      birthDate: profileData.birthDate || "",
      country: profileData.address?.country || "",
      city: profileData.address?.city || "",
      relationshipStatus: profileData.relationshipStatus || "",
    })
  }

  const handleCancel = () => {
    setIsEdit(false)
  }

  const handleSave = (dataForm: FormProfileInfo) => {
    // console.log("dataForm brefore", dataForm)

    const dataToSend = {
      userInfo: {
        ...dataForm,
        address: {
          country: dataForm.country,
          city: dataForm.city,
        },
      },
    }
    // console.log("dataToSend after", dataToSend)
    dispatch(changeMyProfileThunk(dataToSend))
    // здесь можно собрать данные и отправить на сервер
    setIsEdit(false)
  }
  // console.log("profileData", profileData)

  // if (profileData.profileLoading) {
  //   return <div>Загрузка...</div>
  // }

  //   if (!profileData.profile) {
  //     return <div>Профиль не найден</div>
  //   }

  useEffect(() => {
    console.log("Компонент смонтирован")
    return () => {
      console.log("Компонент размонтирован!")
    }
  }, [])
  if (!profileData || !profileData.address || profileData.profileLoading) {
    return <div>Загрузка профиля...</div>
  }
  const handleCloseModal = () => {
    setChangeAvatarModal(false)
  }
  const handleOpenModal = () => {
    if (isMyProfilePage) {
      setChangeAvatarModal(true)
    }
  }

  const handleUserAvatarUpload = async (file: File) => {
    await dispatch(changeAvatarUserThunk(file)).unwrap()
  }

  const handleSubscribe = (userId: string) => {
    dispatch(subscribeToUserThunk(userId))
  }

  const handleUnsubscribe = (userId: string) => {
    dispatch(unsubscribeFromUserThunk(userId))
  }

  const handleShowModalCreateMessage = () => {
    setShowModalCreateMessage(true)
  }
  const handleCloseModalCreateMessage = () => {
    setShowModalCreateMessage(false)
  }

  const handleCall = () => {
    if (!userId) return
    const targetUserId = userId

    callStart(targetUserId, avatar, username)
  }

  // console.log("Перерендер страницы")
  return (
    <>
      {changeAvatarModal && (
        <ChangeAvatarModal
          handleCloseModal={handleCloseModal}
          loading={loading}
          onUpload={handleUserAvatarUpload}
        />
      )}
      {showModalCreateMessage && userId && (
        <CreateUserMessageModal
          onClose={handleCloseModalCreateMessage}
          userId={userId}
        />
      )}
      <div className={style.wrapper}>
        {/* <h2>ProfileBlock</h2> */}
        <div className={style.profileContainer}>
          <div className={style.imageContainer}>
            <div className={style.userImgOnlineBlock}>
              <div className={style.blockImg} onClick={handleOpenModal}>
                <CloudinaryImage
                  src={profileData.avatar || ""}
                  alt="avatar"
                  width={600}
                  height={600}
                />
              </div>
              {status?.isOnline && <div className={style.onlineBlock}></div>}
            </div>
            {!status?.isOnline && lastSeen && (
              <div className={style.lastSeenBlock}>
                <div>Был онлайн:</div>
                <div>
                  {typeof lastSeen === "string" ? formatData(lastSeen) : ""}
                </div>
              </div>
            )}
          </div>

          <div className={style.infoBlock}>
            {isEdit ? (
              <form onSubmit={handleSubmit(handleSave)} className={style.form}>
                <div>
                  <label htmlFor="login">Имя:</label>
                  <input
                    id="name"
                    {...register("name")}
                    placeholder={profileData.name || "Введите имя"}
                  />
                  {errors.name && <p>{errors.name?.message as string}</p>}
                  {/* <div>Имя:{profileData.name && <div>{profileData.name}</div>}</div> */}
                </div>
                <div>
                  <label htmlFor="login">Фамилия:</label>
                  <input
                    id="sureName"
                    {...register("sureName")}
                    placeholder={profileData.sureName || "Введите фамилию"}
                  />
                  {errors.sureName && (
                    <p>{errors.sureName?.message as string}</p>
                  )}
                  {/* Фамилия:{profileData.sureName && <div>{profileData.sureName}</div>} */}
                </div>

                <div>
                  <label htmlFor="login">Статус:</label>
                  <input
                    id="status"
                    {...register("status")}
                    placeholder={profileData.status || "Введите статус"}
                  />
                  {errors.status && <p>{errors.status?.message as string}</p>}
                  {/* Статус:{profileData.status && <div>{profileData.status}</div>} */}
                </div>
                <div>
                  <label>Дата рождения:</label>
                  <input type="date" {...register("birthDate")} />

                  {/* <label htmlFor="login">Возраст</label>
                <input
                  id="age"
                  {...register("age")}
                  placeholder={profileData.age || "Введите возраст"}
                /> */}
                  {errors.birthDate && (
                    <p>{errors.birthDate?.message as string}</p>
                  )}
                  {/* Возраст:{profileData.age && <div>{profileData.age}</div>} */}
                </div>
                <div>
                  <label htmlFor="login">Страна:</label>
                  <input
                    id="country"
                    {...register("country")}
                    placeholder={
                      profileData.address.country || "Введите страну"
                    }
                  />
                  {errors.country && <p>{errors.country?.message as string}</p>}
                  {/* Страна:
            {profileData.address?.country && (
              <div>{profileData.address?.country}</div>
            )} */}
                </div>
                <div>
                  <label htmlFor="login">Город:</label>
                  <input
                    id="city"
                    {...register("city")}
                    placeholder={profileData.address.city || "Введите город"}
                  />
                  {errors.city && <p>{errors.city?.message as string}</p>}
                  {/* Город:
            {profileData.address?.city && (
              <div>{profileData.address?.city}</div>
            )} */}
                </div>

                <div>
                  <label htmlFor="login">Статус отношений:</label>
                  <input
                    id="relationshipStatus"
                    {...register("relationshipStatus")}
                    placeholder={
                      profileData.relationshipStatus ||
                      "Введите статус отношений"
                    }
                  />
                  {errors.relationshipStatus && (
                    <p>{errors.relationshipStatus?.message as string}</p>
                  )}
                  {/* Статус отношений:
            {profileData.relationshipStatus && (
              <div>{profileData.relationshipStatus}</div>
            )} */}
                </div>
                <div>
                  <ButtonMenu
                    disabled={loading}
                    loading={loading}
                    type="submit"
                  >
                    Сохранить
                  </ButtonMenu>
                  <ButtonMenu type="button" onClick={handleCancel}>
                    Отмена
                  </ButtonMenu>
                </div>
              </form>
            ) : (
              <>
                {/* {(profileData.name || profileData.isMyProfile) && (
                  <div>
                    <span>Имя:</span>
                    <span>{profileData.name || "Введите имя"}</span>
                  </div>
                )} */}
                <div>
                  <span>Имя:</span>
                  <span>
                    {profileData.name ||
                      (profileData.isMyProfile ? "Введите имя" : "пусто")}
                  </span>
                </div>

                {(profileData.sureName || profileData.isMyProfile) && (
                  <div>
                    <span>Фамилия:</span>
                    <span>{profileData.sureName || "Введите фамилию"}</span>
                  </div>
                )}

                {(profileData.status || profileData.isMyProfile) && (
                  <div>
                    <span>Статус:</span>
                    <span>{profileData.status || "Введите статус"}</span>
                  </div>
                )}

                {(profileData.birthDate || profileData.isMyProfile) && (
                  <div>
                    <span>Возраст:</span>
                    <span>
                      {profileData.birthDate
                        ? getAgeFromBirthDate(profileData.birthDate)
                        : "Введите возраст"}
                    </span>
                  </div>
                )}

                <div>
                  <span>Страна:</span>
                  <span>
                    {profileData.address?.country ||
                      (profileData.isMyProfile ? "Введите страну" : "пусто")}
                  </span>
                </div>
                {/* {(profileData.address?.country || profileData.isMyProfile) && (
                  <div>
                    <span>Страна:</span>
                    <span>
                      {profileData.address?.country || "Введите страну"}
                    </span>
                  </div>
                )} */}

                {(profileData.address?.city || profileData.isMyProfile) && (
                  <div>
                    <span>Город:</span>
                    <span>{profileData.address?.city || "Введите город"}</span>
                  </div>
                )}

                {(profileData.relationshipStatus ||
                  profileData.isMyProfile) && (
                  <div>
                    <span>Статус отношений:</span>
                    <span>
                      {profileData.relationshipStatus ||
                        "Введите статус отношений"}
                    </span>
                  </div>
                )}

                <div className={style.buttonBlock}>
                  {profileData.isMyProfile && (
                    <ButtonMenu onClick={handleEditClick}>
                      Редактировать
                    </ButtonMenu>
                  )}
                  {!isMyProfilePage && (
                    <div
                      className={style.button}
                      onClick={handleCall}
                      // className={style.linkWantToSee}
                    >
                      <div>📞</div>
                      {/* <ButtonMenu>Список желаемого</ButtonMenu> */}
                    </div>
                  )}
                  {!profileData.isMyProfile && (
                    <Link
                      href={`/userMovie/${userId}`}
                      className={style.button}
                      title="Список желаемого"
                      prefetch={false}
                      // className={style.linkWantToSee}
                    >
                      <StarButton />
                      {/* <ButtonMenu>Список желаемого</ButtonMenu> */}
                    </Link>
                  )}

                  {!isMyProfilePage && (
                    <div
                      className={style.button}
                      onClick={handleShowModalCreateMessage}
                    >
                      <MessageText />
                    </div>
                    // <ButtonMenu >
                    //   Написать сообщение
                    // </ButtonMenu>
                  )}

                  {!isMyProfilePage &&
                    (profileData.isSubscribed ? (
                      <div
                        title="Отписаться"
                        onClick={() => {
                          if (userId) handleUnsubscribe(userId)
                        }}
                        className={style.button}
                      >
                        <UnSubButton />
                      </div>
                    ) : (
                      // <ButtonMenu
                      //   onClick={() => {
                      //     if (userId) handleUnsubscribe(userId)
                      //   }}
                      // >
                      //   Отписаться
                      // </ButtonMenu>
                      <div
                        title="Подписаться"
                        onClick={() => {
                          if (userId) handleSubscribe(userId)
                        }}
                        className={style.button}
                      >
                        <SubButton />
                      </div>
                      // <ButtonMenu
                      //   onClick={() => {
                      //     if (userId) handleSubscribe(userId)
                      //   }}
                      // >
                      //   Подписаться
                      // </ButtonMenu>
                    ))}
                  {
                    !isMyProfilePage && userId && friendshipStatus && (
                      <ButtonUserStatus
                        status={friendshipStatus}
                        id={userId}
                        profile="true"
                        className={style.button}
                      />
                    )

                    // friendshipStatus(profileData.friendshipStatus)
                    // (
                    //   <div className={style.subButton}>
                    //     <Trash />
                    //   </div>
                    // )
                  }
                </div>
                {profileData.subscriptions.length > 0 && (
                  <SubBlock
                    subsData={profileData.subscriptions}
                    type={"subscriptions"}
                    usersOnline={usersOnline}
                  />
                )}
                {profileData.subscribers.length > 0 && (
                  <SubBlock
                    subsData={profileData.subscribers}
                    type={"subscribers"}
                    usersOnline={usersOnline}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfileBlock
