import { EmojiId } from "@/constants/reactions"
import { BaseMember } from "./base"

export interface AttachmentType {
  url: string
  mimeType: string
  fileName: string
}

export type ReactionType = {
  _id: string
  user: { _id: string; username: string; avatar: string }
  emoji: EmojiId
  createdAt: string
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
  replyTo?: string | null
  reactions: ReactionType[]
  readCount: number
  createdAt: string
}
// reactions: [
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     emoji: {
//       type: String, // "😂" или "laugh" (id кастомного)
//       required: true,
//     },
//   },
// ],

export type MemberType = BaseMember
// export interface MemberType {
//   _id: string
//   username: string
//   avatar: string
// }

export interface MemberFullType {
  user: MemberType
  type: "admin" | "member"
  unreadCount: number
}

export interface ConversationType {
  _id: string
  type: "private" | "group"
  title: string // для групп
  avatar: string // для групп
  avatarPublicId: string
  owner: string
  members: MemberFullType[]
  lastMessageId?: MessageType
  description: string
  updatedAt: string
}

export type messageViewersUserType = {
  conversationId: string

  messageId: string

  readAt: string

  userId: MemberType

  _id: string
}

export interface ConversationsState {
  conversations: ConversationType[]
  currentConversation: ConversationType | null
  messages: MessageType[]
  messageViewers: {
    users: messageViewersUserType[]
    isLoading: boolean
  }
  loading: boolean
  error: string | null
  pagination: {
    hasMoreOlder: boolean // есть ли старые сверху
    // hasMoreNewer: boolean // есть ли новые снизу
    hasLoaded: boolean
    page: number
    pages: number
  }
  lastReadMessageId: string | null // для разделителя
  lastReadMessageDate: string | null
  unreadCount: number // для зелёного кружка
  pendingNewMessages: number // для кнопки "↓ 3 новых"
  oldestMessageId: string | null
}
