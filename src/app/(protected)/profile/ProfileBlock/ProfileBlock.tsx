"use client"
import { useState } from "react"
import style from "./ProfileBlock.module.scss"
import { useForm } from "react-hook-form"
import { useAppDispatch } from "@/store/hooks"
import { changeMyProfileThunk } from "@/store/thunks/profileThunk"
import ButtonMenu from "@/components/ui/button/Button"

type FormProfileInfo = {
  name: string
  sureName: string
  status: string
  age: string
  country: string
  city: string
  relationshipStatus: string
}
type profileDataType = {
  address: { country: string; city: string }
  age: string
  isMyProfile: boolean
  name: string
  profileError: null | string
  profileLoading: boolean
  relationshipStatus: string
  status: string
  sureName: string
}

const ProfileBlock = ({ profileData }: { profileData: profileDataType }) => {
  console.log("profileData", profileData)
  const dispatch = useAppDispatch()
  const [isEdit, setIsEdit] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormProfileInfo>()
  const handleEditClick = () => {
    setIsEdit(true)
  }

  const handleCancel = () => {
    setIsEdit(false)
  }

  const handleSave = (dataForm: FormProfileInfo) => {
    console.log("dataForm", dataForm)

    const dataToSend = {
      userInfo: {
        name: dataForm.name || profileData.name,
        sureName: dataForm.sureName || profileData.sureName,
        status: dataForm.status || profileData.status,
        age: dataForm.age || profileData.age,
        relationshipStatus:
          dataForm.relationshipStatus || profileData.relationshipStatus,
        address: {
          country: dataForm.country || profileData.address.country,
          city: dataForm.city || profileData.address.city,
        },
      },
    }

    dispatch(changeMyProfileThunk(dataToSend))
    // здесь можно собрать данные и отправить на сервер
    setIsEdit(false)
  }
  console.log("profileData", profileData)
  return (
    <div className={style.wrapper}>
      <h2>ProfileBlock</h2>
      {isEdit ? (
        <form onSubmit={handleSubmit(handleSave)} className={style.form}>
          <div>
            <label htmlFor="login">Имя</label>
            <input
              id="name"
              {...register("name")}
              placeholder={profileData.name || "Введите имя"}
            />
            {errors.name && <p>{errors.name?.message as string}</p>}
            {/* <div>Имя:{profileData.name && <div>{profileData.name}</div>}</div> */}
          </div>
          <div>
            <label htmlFor="login">Фамилия</label>
            <input
              id="sureName"
              {...register("sureName")}
              placeholder={profileData.sureName || "Введите фамилию"}
            />
            {errors.sureName && <p>{errors.sureName?.message as string}</p>}
            {/* Фамилия:{profileData.sureName && <div>{profileData.sureName}</div>} */}
          </div>

          <div>
            <label htmlFor="login">Статус</label>
            <input
              id="status"
              {...register("status")}
              placeholder={profileData.status || "Введите статус"}
            />
            {errors.status && <p>{errors.status?.message as string}</p>}
            {/* Статус:{profileData.status && <div>{profileData.status}</div>} */}
          </div>
          <div>
            <label htmlFor="login">Возраст</label>
            <input
              id="age"
              {...register("age")}
              placeholder={profileData.age || "Введите возраст"}
            />
            {errors.age && <p>{errors.age?.message as string}</p>}
            {/* Возраст:{profileData.age && <div>{profileData.age}</div>} */}
          </div>
          <div>
            <label htmlFor="login">Страна</label>
            <input
              id="country"
              {...register("country")}
              placeholder={profileData.address.country || "Введите страну"}
            />
            {errors.country && <p>{errors.country?.message as string}</p>}
            {/* Страна:
            {profileData.address?.country && (
              <div>{profileData.address?.country}</div>
            )} */}
          </div>
          <div>
            <label htmlFor="login">Город</label>
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
            <label htmlFor="login">Статус отношений</label>
            <input
              id="relationshipStatus"
              {...register("relationshipStatus")}
              placeholder={
                profileData.relationshipStatus || "Введите статус отношений"
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
            <ButtonMenu type="submit">Сохранить</ButtonMenu>
            <ButtonMenu type="button" onClick={handleCancel}>
              Отмена
            </ButtonMenu>
          </div>
        </form>
      ) : (
        <>
          <div>
            <span>Имя:</span>

            <span>{profileData.name || "Введите имя"}</span>
          </div>
          <div>
            <span>Фамилия:</span>

            <span>{profileData.sureName || "Введите фамилию"}</span>
          </div>
          <div>
            <span>Статус:</span>

            <span>{profileData.status || "Введите статус"}</span>
          </div>
          <div>
            <span>Возраст:</span>

            <span>{profileData.age || "Введите возраст"}</span>
          </div>
          <div>
            <span>Страна:</span>

            <span>{profileData.address?.country || "Введите страну"}</span>
          </div>
          <div>
            <span>Город:</span>

            <span>{profileData.address?.city || "Введите город"}</span>
          </div>

          <div>
            <span>Статус отношений:</span>

            <span>
              {profileData.relationshipStatus || "Введите статус отношений"}
            </span>
          </div>
          <div>
            {profileData.isMyProfile && (
              <ButtonMenu onClick={handleEditClick}>Редактировать</ButtonMenu>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ProfileBlock
