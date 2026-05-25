export type CinemaHallTargetType = {
  groupId: string | null
  cinemaHallId: string | null
  cinemaHallName: string | null
  hostId: string | null
  hostSocketId: string | null
  participants: ParticipantsType[]
  file: FileType
  isMembersControl: boolean
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
  // fileReady: string | null
  buffering: boolean
  // connected: boolean
  disconnectTimer?: number | null
  peerId: string | null
  socketId: string | null
}
export type ChatMessageType = {
  id: string
  userId: string | null
  username: string | null
  text: string | null
  avatar: string | null
  dateAt: string | null
}

export type CinemaHallStateType = {
  cinemaHalls: CinemaHallTargetType[]
  cinemaHallTarget: CinemaHallTargetType
}
