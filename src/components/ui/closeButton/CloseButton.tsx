"use client"
import React from "react"
import styles from "./CloseButton.module.scss"

type Props = {
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void
  title?: string // при наведении будет подсказка
  style?: object
}

const CloseButton = ({ onClick, title = "Удалить", style = {} }: Props) => {
  return (
    <button
      className={styles.closeButton}
      onClick={onClick}
      title={title}
      aria-label={title}
      style={style}
    >
      ✕
    </button>
  )
}

export default CloseButton
