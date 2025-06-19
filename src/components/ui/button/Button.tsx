import style from "./Button.module.scss"
const ButtonMenu = ({
  children,
  onClick,
  type,
}: {
  children: string
  onClick?: () => void | undefined
  type?: "button" | "submit" | "reset" | undefined
}) => {
  return (
    <button onClick={onClick} className={style.button} type={type}>
      {children}
    </button>
  )
}

export default ButtonMenu
