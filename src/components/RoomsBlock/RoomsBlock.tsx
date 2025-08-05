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
import style from "./RoomsBlock.module.scss"
import { AddRoomBlock } from "@/components/addRoomBlock/AddRoomBlock"
import { RoomCard } from "@/components/roomCard/RoomCard"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Paginator } from "@/components/Paginator/Paginator"

export default function RoomsBlock() {
  const [showAddBlock, setShowAddBlock] = useState(false)
  const { rooms, pages, page } = useAppSelector(
    (state: RootState) => state.rooms
  )
  const isAuth = useAppSelector((state: RootState) => state.auth.isAuth)
  const userId = useAppSelector((state: RootState) => state.auth.userId)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pageFromUrl = Number(searchParams?.get("page")) || 1
  // const { posts, page, pages,loading } = useAppSelector((state) => state.roomPost)

  const handleCloseBlock = () => {
    setShowAddBlock(false)
  }

  const delRoom = (roomId: string) => {
    dispatch(delRoomThunk({ roomId, page: pageFromUrl }))
  }
  const leaveRoom = (roomId: string) => {
    dispatch(leaveRoomThunk({ roomId, page: pageFromUrl }))
  }

  useEffect(() => {
    dispatch(getRoomsThunk(pageFromUrl))
  }, [isAuth, dispatch, pageFromUrl])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set("page", String(newPage))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })

    // dispatch(setRoomPage(newPage)) // переключаем страницу в Redux
  }
  console.log("rooms", rooms)
  return (
    <div className={style.wrapper}>
      {/* <input
        type="text"
        onChange={(e) => setName(e.target.value)}
        value={name}
      /> */}
      {showAddBlock && <AddRoomBlock handleCloseBlock={handleCloseBlock} />}
      <div className={style.buttonBlock}>
        <ButtonMenu
          onClick={() => {
            setShowAddBlock(true)
            // dispatch(createRoomThunk(name))
          }}
        >
          создать комнату
        </ButtonMenu>
      </div>
      {pages > 1 && (
        <Paginator pages={pages} onPageChange={handlePageChange} page={page} />
      )}

      <div className={style.containerRooms}>
        {rooms.length > 0
          ? rooms.map((room) => (
              <RoomCard
                key={room._id}
                data={room}
                userId={userId as string}
                delRoom={delRoom}
                leaveRoom={leaveRoom}
              />
            ))
          : "Нет комнат"}
      </div>
    </div>
  )
}
