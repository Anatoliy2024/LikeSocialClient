export type CinemaHallTargetType = {
  cinemaHallId: string | null
  cinemaHallName: string | null
  hostId: string | null
  participants: ParticipantsType[]
  file: FileType | null
  currentTime: number
  playing: boolean
  updatedAt: string | null
  chat: ChatType[]
}

export type FileType = {
  name: string | null
  size: number
}

export type ParticipantsType = {
  username: string | null
  fileReady: string | null
}
export type ChatType = {
  user: string | null
  text: string | null
  dataAt: string | null
}

export type CinemaHallStateType = {
  cinemaHalls: any[]
  cinemaHallTarget: CinemaHallTargetType
}
