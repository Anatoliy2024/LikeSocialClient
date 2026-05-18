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
  playbackUpdatedAt: number | null // когда последний раз менялось состояние
  seqNum: number // порядковый номер команды
  waitingForUsers: string[] // кто сейчас буферизует
}

export type FileType = {
  name: string | null
  size: number
  magnet: string | null
}

export type ParticipantsType = {
  userId: string | null
  username: string | null
  avatar: string | null
  fileReady: string | null
  bufferring: boolean
  connected: boolean
  disconnectTimer: number | null
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
