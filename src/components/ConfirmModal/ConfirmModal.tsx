import style from "./ConfirmModal.module.scss"

interface ConfirmModalProps {
  isOpen: boolean
  title?: string
  message?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title = "Вы уверены?",
  message = "Вы уверены, что хотите удалить?",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className={style.overlay}>
      <div className={style.modal}>
        <h2 className={style.title}>{title}</h2>
        {message && <p className={style.description}>{message}</p>}
        <div className={style.buttons}>
          <button className={style.cancel} onClick={onCancel}>
            Отмена
          </button>
          <button className={style.confirm} onClick={onConfirm}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}
