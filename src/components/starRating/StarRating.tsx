"use client"
import { useState } from "react"
import { UseFormSetValue, UseFormWatch } from "react-hook-form"
import style from "./StarRating.module.scss"

type Props = {
  name: string
  setValue: UseFormSetValue<any>
  watch: UseFormWatch<any>
}

const StarRating = ({ name, setValue, watch }: Props) => {
  const [hovered, setHovered] = useState(0)
  const selected = watch(name) || 0

  return (
    <div className={style.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <label
          key={star}
          className={style.star}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => setValue(name, star)}
        >
          <input
            type="radio"
            value={star}
            name={name}
            className={style.input}
            readOnly
          />
          <span
            className={`${style.starSymbol} ${
              (hovered || selected) >= star ? style.active : ""
            }`}
          >
            ★
          </span>
        </label>
      ))}
    </div>
  )
}

export default StarRating
