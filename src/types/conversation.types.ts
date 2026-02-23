import { BaseMember } from "./base"

export interface AttachmentType {
  url: string
  mimeType: string
  fileName: string
}

export interface MessageType {
  _id: string
  conversationId: string
  senderId: {
    _id: string
    username: string
    avatar: string
  }
  type: "text" | "image" | "video" | "audio" | "sticker" | "system"
  text?: string
  attachments?: AttachmentType[]
  sticker?: string
  replyTo?: MessageType | null
  createdAt: string
}

export type MemberType = BaseMember
// export interface MemberType {
//   _id: string
//   username: string
//   avatar: string
// }

export interface MemberFullType {
  user: MemberType
  type: "admin" | "member"
}

export interface ConversationType {
  _id: string
  type: "private" | "group"
  title: string // для групп
  avatar: string // для групп
  members: MemberFullType[]
  lastMessageId?: MessageType
  description: string
  updatedAt: string
}

export interface ConversationsState {
  conversations: ConversationType[]
  currentConversation: ConversationType | null
  messages: MessageType[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    pages: number
    total: number
    hasMore: boolean
    hasLoaded: boolean
  }
}
