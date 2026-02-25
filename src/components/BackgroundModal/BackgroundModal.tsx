"use client"
// import { useEffect } from "react"
import style from "./BackgroundModal.module.scss"
export const BackgroundModal = ({ onClose }: { onClose: () => void }) => {
  // useEffect(() => {
  //   // при монтировании — запрещаем прокрутку
  //   document.body.style.overflow = "hidden"

  //   // при размонтировании — возвращаем как было
  //   return () => {
  //     document.body.style.overflow = ""
  //   }
  // }, [])
  return (
    <div
      className={style.backgroundModal}
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    ></div>
  )
}
