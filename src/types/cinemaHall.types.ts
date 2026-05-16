export type CinemaHallTargetType = {
  groupId: string | null
  cinemaHallId: string | null
  cinemaHallName: string | null
  hostId: string | null
  participants: ParticipantsType[]
  file: FileType
  currentTime: number
  playing: boolean
  updatedAt: string | null
  chat: ChatMessageType[]
}

export type FileType = {
  name: string | null
  size: number
  magnet: string | null
}

export type ParticipantsType = {
  username: string | null
  fileReady: string | null
}
export type ChatMessageType = {
  id: string | null
  username: string | null
  text: string | null
  dateAt: string | null
}

export type CinemaHallStateType = {
  cinemaHalls: CinemaHallTargetType[]
  cinemaHallTarget: CinemaHallTargetType
}
