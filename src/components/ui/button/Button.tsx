import Spinner from "../spinner/Spinner"
import style from "./Button.module.scss"
const ButtonMenu = ({
  children,
  onClick,
  type,
  disabled = false,
  loading = false,
}: {
  children: string
  onClick?: () => void | undefined
  type?: "button" | "submit" | "reset" | undefined
  disabled?: boolean
  loading?: boolean
}) => {
  console.log("loading", loading)
  console.log("disabled", disabled)
  return (
    <button
      onClick={onClick}
      className={style.button}
      type={type}
      disabled={disabled}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

export default ButtonMenu
