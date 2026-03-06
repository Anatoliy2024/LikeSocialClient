"use client"
import { CancelIcon } from "@/assets/icons/CancelIcon"
import { ConfirmIcon } from "@/assets/icons/ConfirmIcon"
import { SendMessage } from "@/assets/icons/sendMessage"
import Image from "next/image"
import { StickersBlock } from "../StickersBlock/StickersBlock"
import { Sticker } from "@/assets/icons/sticker"
import style from "./MessageBlockInput.module.scss"
import { useEffect, useRef, useState } from "react"
import { fileAPI } from "@/api/api"
import { getSocket } from "@/lib/socket"
import { compressImage } from "@/utils/compressImage"

type IsEditMessageType = {
  messageId: string
  isEdit: boolean
  text: string
}

export const MessageBlockInput = ({
  id,
  isEditMessage,
  messagesEndRef,
  handleCloseEditMessage,
}: {
  id: string
  isEditMessage: IsEditMessageType
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  handleCloseEditMessage: () => void
}) => {
  const [textMessage, setTextMessage] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showStickers, setShowStickers] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const socket = getSocket()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (!isEditMessage.isEdit) {
        handleSendMessage()
      } else {
        handleEditMessage()
      }
    }
  }

  const handleSendMessage = async () => {
    // console.log("handleSendMessage")
    if (!textMessage.trim() && !selectedImage) return
    try {
      if (selectedImage) {
        setIsUploading(true)
        const data = await fileAPI.uploadChatImage(selectedImage)
        setIsUploading(false)
        socket.emit("message:send", {
          conversationId: id,
          type: "image",
          attachments: [data],
          text: textMessage || undefined,
        })
      } else {
        socket.emit("message:send", {
          conversationId: id,
          type: "text",
          text: textMessage,
        })
      }
      setTextMessage("")
      setSelectedImage(null)
      setImagePreview(null)
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    } catch (error) {
      setIsUploading(false)
      console.log(error)
    }
  }

  const handleEditMessage = () => {
    socket.emit("messages:edit", {
      messageId: isEditMessage.messageId,
      text: textMessage,
    })
    setTextMessage("")
    handleCloseEditMessage()
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (imagePreview) URL.revokeObjectURL(imagePreview)
    const compressed = await compressImage(file)
    setSelectedImage(compressed as File)
    setImagePreview(URL.createObjectURL(compressed))
  }

  const handleOpenStickers = () => {
    setShowStickers((prev) => !prev)
    // setShowStickers(true)
  }
  const handleCloseStickers = () => {
    setShowStickers(false)
  }

  const handleSendSticker = (stickerId: string) => {
    socket.emit("message:send", {
      conversationId: id,
      type: "sticker",
      sticker: stickerId,
    })
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    })
    handleCloseStickers()
  }

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  useEffect(() => {
    if (isEditMessage?.text) {
      setTextMessage(isEditMessage.text) // ← вот тут подхватываешь
    }
  }, [isEditMessage])
  console.log("messageBlockInput ререндер")
  return (
    <div className={style.messageBlockInput}>
      {isEditMessage.isEdit && (
        <div className={style.messageBlockInput__editTitle}>редактирование</div>
      )}

      <div className={style.messageBlockInput__newMessageBlockInput}>
        <input
          type="text"
          placeholder="Сообщение"
          onChange={(e) => setTextMessage(e.target.value)}
          value={textMessage}
          onKeyDown={handleKeyDown}
        />
      </div>

      {!isEditMessage.isEdit && (
        <div className={style.messageBlockInput__newMessageBlockButtons}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageSelect}
          />

          <div className={style.messageBlockInput__stickers}>
            <div
              className={`${style.messageBlockInput__stickersButton} ${
                showStickers
                  ? style.messageBlockInput__stickersButtonActive
                  : ""
              }`}
              onClick={handleOpenStickers}
            >
              <Sticker />
            </div>
            {showStickers && (
              <StickersBlock
                onClose={handleCloseStickers}
                handleSendSticker={handleSendSticker}
              />
            )}
          </div>

          <div className={style.messageBlockInput__newMessageUploadImage}>
            {imagePreview && (
              <div className={style.messageBlockInput__imagePreview}>
                <Image
                  src={imagePreview}
                  width={200}
                  height={200}
                  alt="preview"
                />
                <button
                  className={style.messageBlockInput__imagePreviewCloseWrapper}
                  onClick={() => {
                    if (imagePreview) URL.revokeObjectURL(imagePreview)
                    setSelectedImage(null)
                    setImagePreview(null)
                  }}
                >
                  <div>✕</div>
                </button>
              </div>
            )}
            <div
              className={style.messageBlockInput__newMessageUploadImageButton}
              onClick={() => fileInputRef.current?.click()}
            >
              📎
            </div>
          </div>

          <div
            onClick={!isUploading ? handleSendMessage : undefined}
            title="Отправить сообщение"
            className={style.messageBlockInput__newMessageButtonBlock}
            style={{
              opacity: isUploading ? 0.5 : 1,
              cursor: isUploading ? "not-allowed" : "pointer",
            }}
          >
            {isUploading ? "..." : <SendMessage />}
          </div>
        </div>
      )}
      {isEditMessage.isEdit && (
        <div className={style.messageBlockInput__editButton}>
          <div
            onClick={() => {
              handleCloseEditMessage()
              setTextMessage("")
            }}
          >
            <CancelIcon />
          </div>
          <div onClick={handleEditMessage}>
            <ConfirmIcon />
          </div>
        </div>
      )}
    </div>
  )
}
