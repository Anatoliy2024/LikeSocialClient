"use client"
import { useEffect, useState } from "react"
import style from "./ChangeAvatarModal.module.scss"

import ButtonMenu from "@/components/ui/button/Button"
// import { useAppDispatch, useAppSelector } from "@/store/hooks"
// import { changeAvatarUserThunk } from "@/store/thunks/profileThunk"
// import { RootState } from "@/store/store"
import Image from "next/image"
export const ChangeAvatarModal = ({
  handleCloseModal,
  onUpload,
  loading,
  roomId,
}: {
  handleCloseModal: () => void
  onUpload: (file: File, roomId?: string) => Promise<void>
  loading: boolean
  roomId?: string
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // const dispatch = useAppDispatch()
  // const loading = useAppSelector(
  //   (state: RootState) => state.profile.profileLoading
  // )
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile)) // создаём URL для предпросмотра
    }
  }

  // const handleUpload = async () => {
  //   if (!file) return
  //   try {
  //     await dispatch(changeAvatarUserThunk(file)).unwrap()
  //     handleCloseModal()
  //   } catch (error) {
  //     console.error("Ошибка загрузки:", error)
  //   }
  // }
  const handleUpload = async () => {
    if (!file) return
    try {
      await onUpload(file, roomId)
      handleCloseModal()
    } catch (error) {
      console.error("Ошибка загрузки:", error)
    }
  }

  // Удаляем объект URL при размонтировании или смене файла
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className={style.wrapper} onClick={handleCloseModal}>
      <div className={style.container} onClick={(e) => e.stopPropagation()}>
        <input type="file" accept="image/*" onChange={handleChange} />
        {previewUrl && (
          <div className={style.preview}>
            <Image
              src={previewUrl}
              alt="Предпросмотр аватара"
              className={style.preview}
              width={200}
              height={200}
            />
          </div>
        )}
        <ButtonMenu
          loading={loading}
          disabled={loading}
          onClick={() => {
            handleUpload()
          }}
        >
          Загрузить
        </ButtonMenu>

        <ButtonMenu
          onClick={() => {
            handleCloseModal()
          }}
        >
          Закрыть
        </ButtonMenu>
      </div>
    </div>
  )
}
