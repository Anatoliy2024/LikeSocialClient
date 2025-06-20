"use client"
import { useState } from "react"
import {
  UseFormSetValue,
  UseFormWatch,
  Path, // добавлен импорт
  FieldValues,
  PathValue,
} from "react-hook-form"
import style from "./StarRating.module.scss"

// Тип пропсов
type Props<
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
> = {
  name: TName
  setValue: UseFormSetValue<TFieldValues>
  watch: UseFormWatch<TFieldValues>
}

// Компонент
const StarRating = <
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>
>({
  name,
  setValue,
  watch,
}: Props<TFieldValues, TName>) => {
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
          onClick={() => setValue(name, star as PathValue<TFieldValues, TName>)}
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

// "use client"
// import { useState } from "react"
// import { UseFormSetValue, UseFormWatch,Path  } from "react-hook-form"
// import style from "./StarRating.module.scss"

// // type RatingFormValues = {
// //   stars: number
// //   acting: number
// //   specialEffects: number
// //   story: number
// // }

// // type Props = {
// //   name: keyof RatingFormValues
// //   setValue: UseFormSetValue<RatingFormValues>
// //   watch: UseFormWatch<RatingFormValues>
// // }
// type RatingKeys = "stars" | "acting" | "specialEffects" | "story"

// type Props<TFieldValues, TName extends Path<TFieldValues>> = {
//   name: TName
//   setValue: UseFormSetValue<TFieldValues>
//   watch: UseFormWatch<TFieldValues>
// }

// const StarRating = <TFieldValues, TName extends Path<TFieldValues>>({ name, setValue, watch }: Props<TFieldValues>) => {
//   console.log("setValue", setValue)
//   console.log("watch", watch)
//   const [hovered, setHovered] = useState(0)
//   const selected = watch(name) || 0

//   return (
//     <div className={style.stars}>
//       {[1, 2, 3, 4, 5].map((star) => (
//         <label
//           key={star}
//           className={style.star}
//           onMouseEnter={() => setHovered(star)}
//           onMouseLeave={() => setHovered(0)}
//           onClick={() => setValue(name, star)}
//         >
//           <input
//             type="radio"
//             value={star}
//             name={name}
//             className={style.input}
//             readOnly
//           />
//           <span
//             className={`${style.starSymbol} ${
//               (hovered || selected) >= star ? style.active : ""
//             }`}
//           >
//             ★
//           </span>
//         </label>
//       ))}
//     </div>
//   )
// }

// export default StarRating
