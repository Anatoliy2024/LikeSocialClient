"use client"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import { STICKERS, StickersTypeItem } from "@/constants/stickers"
import style from "./StickersBlock.module.scss"
import Image from "next/image"
import { useEffect, useState } from "react"

import { Swiper, SwiperSlide } from "swiper/react"

export function StickersBlock({
  onClose,
  handleSendSticker,
}: {
  onClose: () => void
  handleSendSticker: (stickerId: string) => void
}) {
  const keys = Object.keys(STICKERS)
  const [stickerPack, setStickerPack] = useState(keys[0])

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
        <Swiper
          spaceBetween={20}
          slidesPerView="auto"
          navigation
          pagination={{ clickable: true }}
          loop={false}
          className={style.stickersBlock__listPacket}
        >
          {keys.map((stickerKey, i) => (
            <SwiperSlide key={stickerKey} style={{ width: "auto" }}>
              <li
                onClick={() => setStickerPack(stickerKey)}
                className={
                  stickerKey === stickerPack
                    ? style.stickersBlock__listPacketActive
                    : ""
                }
              >
                <Image
                  src={STICKERS[keys[i]][0].image}
                  width={70}
                  height={70}
                  alt={stickerKey}
                />
              </li>
            </SwiperSlide>
          ))}
        </Swiper>
        {/* <ul className={style.stickersBlock__listPacket}>
          {keys.map((stickerKey, i) => (
            <li
              key={stickerKey}
              onClick={() => setStickerPack(stickerKey)}
              className={
                stickerKey === stickerPack
                  ? style.stickersBlock__listPacketActive
                  : ""
              }
            >
              <Image
                src={STICKERS[keys[i]][0].image}
                width={70}
                height={70}
                alt={stickerKey}
              />
            </li>
          ))}
        </ul> */}
        <div className={style.stickersBlock__dividingLine}></div>
        <StickerPack
          stickers={STICKERS[stickerPack]}
          handleSendSticker={handleSendSticker}
        />
      </div>
    </>
  )
}

const StickerPack = ({
  stickers,
  handleSendSticker,
}: {
  stickers: StickersTypeItem[]
  handleSendSticker: (stickerId: string) => void
}) => {
  return (
    <ul className={style.stickersPackList}>
      {stickers.map((sticker) => (
        <li key={sticker.id}>
          <Image
            src={sticker.image}
            width={120}
            height={120}
            alt={sticker.id}
            onClick={() => handleSendSticker(sticker.id)}
          />
        </li>
      ))}
    </ul>
  )
}
