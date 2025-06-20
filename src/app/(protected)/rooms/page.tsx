"use client"

import ButtonMenu from "@/components/ui/button/Button"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { RootState } from "@/store/store"
import {
  delRoomThunk,
  getRoomsThunk,
  leaveRoomThunk,
} from "@/store/thunks/roomsThunk"
import { useEffect, useState } from "react"
import style from "./Rooms.module.scss"
import { AddRoomBlock } from "./addRoomBlock/AddRoomBlock"
import { RoomCard } from "./roomCard/RoomCard"
export default function Rooms() {
  const [showAddBlock, setShowAddBlock] = useState(false)
  const rooms = useAppSelector((state: RootState) => state.rooms.rooms)
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const userId = useAppSelector((state: RootState) => state.auth.userId)
  const dispatch = useAppDispatch()
  const handleCloseBlock = () => {
    setShowAddBlock(false)
  }

  const delRoom = (roomId: string) => {
    dispatch(delRoomThunk(roomId))
  }
  const leaveRoom = (roomId: string) => {
    dispatch(leaveRoomThunk(roomId))
  }

  useEffect(() => {
    dispatch(getRoomsThunk())
  }, [isAuth, dispatch])
  return (
    <div className={style.wrapper}>
      {/* <input
        type="text"
        onChange={(e) => setName(e.target.value)}
        value={name}
      /> */}
      {showAddBlock && <AddRoomBlock handleCloseBlock={handleCloseBlock} />}

      <ButtonMenu
        onClick={() => {
          setShowAddBlock(true)
          // dispatch(createRoomThunk(name))
        }}
      >
        создать комнату
      </ButtonMenu>
      <div className={style.containerRooms}>
        {rooms.length > 0
          ? rooms.map((room) => (
              <RoomCard
                key={room._id}
                data={room}
                userId={userId}
                delRoom={delRoom}
                leaveRoom={leaveRoom}
              />
            ))
          : "Нет комнат"}
      </div>
    </div>
  )
}

// "use client"

// import RoomsCommon from "./_components/RoomsCommon"

// export default function Rooms() {
//   return <RoomsCommon mainRoom />
// }
