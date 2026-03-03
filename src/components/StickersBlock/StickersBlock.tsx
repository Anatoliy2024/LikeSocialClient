"use client"
import { STICKERS, StickersTypeList } from "@/constants/stickers"
import style from "./StickersBlock.module.scss"
import Image from "next/image"
import { useEffect } from "react"

export function StickersBlock({
  onClose,
  handleSendSticker,
}: {
  onClose: () => void
  handleSendSticker: (stickerId: string) => void
}) {
  const keys = Object.keys(STICKERS)

  useEffect(() => {
    // при монтировании — запрещаем прокрутку
    document.body.style.overflow = "hidden"

    // при размонтировании — возвращаем как было
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <>
      <div className={style.background} onClick={onClose}></div>
      <div className={style.stickersBlock}>
        {keys.map((stickerKey) => {
          return (
            <StickerPack
              stickers={STICKERS[stickerKey]}
              key={stickerKey}
              handleSendSticker={handleSendSticker}
            />
          )
        })}
      </div>
    </>
  )
}

const StickerPack = ({
  stickers,
  handleSendSticker,
}: {
  stickers: StickersTypeList
  handleSendSticker: (stickerId: string) => void
}) => {
  return stickers.map((sticker) => (
    <Image
      key={sticker.id}
      src={sticker.image}
      width={120}
      height={120}
      alt={sticker.id}
      onClick={() => handleSendSticker(sticker.id)}
    />
  ))
}
