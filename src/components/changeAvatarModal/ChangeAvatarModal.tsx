"use client"
import { useEffect, useState } from "react"
import style from "./ChangeAvatarModal.module.scss"

import ButtonMenu from "@/components/ui/button/Button"

import { compressImage } from "@/utils/compressImage"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"

export const ChangeAvatarModal = ({
  handleCloseModal,
  onUpload,
  loading,
  context,
}: {
  handleCloseModal: () => void
  onUpload: (
    file: File,
    context?: {
      roomId?: string
      postId?: string
      userMovieId?: string
      status?: string
    }
  ) => Promise<void>
  loading: boolean
  context?: {
    roomId?: string
    postId?: string
    userMovieId?: string
    status?: string
  }
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadingLocal, setIsLoadingLocal] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile)) // создаём URL для предпросмотра
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setIsLoadingLocal(true)
    try {
      const compressedFile = await compressImage(file)

      // setCompressedSize(compressedFile.size)
      console.log(
        `***********************************************До: ${(
          file.size / 1024
        ).toFixed(2)} KB | После: ${(compressedFile.size / 1024).toFixed(2)} KB`
      )
      await onUpload(compressedFile, context)
      // await onUpload(file, context)
      handleCloseModal()
    } catch (error) {
      console.error("Ошибка загрузки:", error)
    } finally {
      setIsLoadingLocal(false)
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

  useEffect(() => {
    // при монтировании — запрещаем прокрутку
    document.body.style.overflow = "hidden"

    // при размонтировании — возвращаем как было
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <div className={style.wrapper} onClick={handleCloseModal}>
      <div className={style.container} onClick={(e) => e.stopPropagation()}>
        <input type="file" accept="image/*" onChange={handleChange} />
        {previewUrl && (
          <div className={style.preview}>
            <CloudinaryImage
              src={previewUrl}
              alt="Предпросмотр аватара"
              className={style.preview}
              width={200}
              height={200}
            />
          </div>
        )}
        {/* {originalSize && <div>{originalSize}</div>} */}
        <div className={style.buttonBlock}>
          <ButtonMenu
            loading={loading ? loading : loadingLocal}
            disabled={loading ? loading : loadingLocal}
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
    </div>
  )
}
