import style from "./StarRating.module.scss"

type Props = {
  value: number // значение от 0 до 5
}

const StarRatingView = ({ value = 0 }: Props) => {
  return (
    <div className={style.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${style.starSymbol} ${value >= star ? style.active : ""}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default StarRatingView
