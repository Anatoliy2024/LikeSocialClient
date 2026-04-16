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
type Props<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>
  setValue: UseFormSetValue<TFieldValues>
  watch: UseFormWatch<TFieldValues>
}

const StarRating = <TFieldValues extends FieldValues>({
  name,
  setValue,
  watch,
}: Props<TFieldValues>) => {
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
          onClick={() =>
            setValue(name, star as PathValue<TFieldValues, Path<TFieldValues>>)
          }
        >
          <input
            type="radio"
            value={star}
            name={name}
            className={style.input}
            readOnly
          />
          <span
            className={`${style.starSymbol} ${(hovered || selected) >= star ? style.active : ""}`}
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
// import {
//   UseFormSetValue,
//   UseFormWatch,
//   Path, // добавлен импорт
//   FieldValues,
//   PathValue,
// } from "react-hook-form"
// import style from "./StarRating.module.scss"

// // Тип пропсов
// type Props<TFieldValues extends FieldValues> = {
//   name: Path<TFieldValues>
//   setValue: UseFormSetValue<TFieldValues>
//   watch: UseFormWatch<TFieldValues>
// }

// // Компонент
// const StarRating = <TFieldValues extends FieldValues>({
//   name,
//   setValue,
//   watch,
// }: Props<TFieldValues>) => {
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
//           onClick={() => setValue(name, star as PathValue<TFieldValues, Path<TFieldValues>>)}
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
