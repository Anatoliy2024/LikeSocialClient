"use client"
import { AcceptFriend } from "@/assets/icons/acceptFriend"
import { AddFriend } from "@/assets/icons/addFriend"
import { DelFriend } from "@/assets/icons/delFriend"
import { DeniedFriendRequest } from "@/assets/icons/deniedFriendRequest"
import { useState } from "react"
import ConfirmModal from "../ConfirmModal/ConfirmModal"
import style from "./ButtonUserStatus.module.scss"
import { useAppDispatch } from "@/store/hooks"
import {
  acceptFriendThunk,
  cancelRequestFriendThunk,
  delFriendThunk,
  requestFriendThunk,
} from "@/store/thunks/usersThunk"

type ButtonUserStatusProps = {
  status: "friend" | "incoming" | "outgoing" | "none"
  id: string
  page?: number
  profile?: string
  className?: string
}

export const ButtonUserStatus: React.FC<ButtonUserStatusProps> = ({
  status,
  id,
  page,
  profile,
  className,
}) => {
  const [isConfirmOpen, setConfirmOpen] = useState(false)
  const dispatch = useAppDispatch()
  // console.log("id****", id)
  // console.log("status****", status)

  const handleDelete = () => {
    dispatch(delFriendThunk({ userId: id, page, profile }))
    setConfirmOpen(false)
  }

  let friendStatusButtonBlock = null
  let onClickHandler = () => {}
  // console.log("status", status)
  switch (status) {
    case "friend":
      friendStatusButtonBlock = <DelFriend />
      onClickHandler = () => setConfirmOpen(true)
      //  dispatch(delFriendThunk({ userId: id, page }))
      break
    case "incoming":
      friendStatusButtonBlock = <AcceptFriend />
      onClickHandler = () =>
        dispatch(acceptFriendThunk({ userId: id, page, profile }))
      break
    case "outgoing":
      friendStatusButtonBlock = <DeniedFriendRequest />
      onClickHandler = () =>
        dispatch(cancelRequestFriendThunk({ userId: id, page, profile }))
      break
    case "none":
    default:
      friendStatusButtonBlock = <AddFriend />

      onClickHandler = () =>
        dispatch(requestFriendThunk({ userId: id, page, profile }))
      break
  }

  return (
    <>
      <div
        className={`${style.buttonBlock} ${className || ""}`}
        onClick={onClickHandler}
      >
        {friendStatusButtonBlock}
      </div>

      {status === "friend" && (
        <ConfirmModal
          isOpen={isConfirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleDelete}
          title="Удалить друга?"
          message="Вы уверены, что хотите удалить этого пользователя из друзей?"
        />
      )}
    </>
  )
}
