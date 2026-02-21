// export type BaseMessageRequest = {
//   recipientId?: string
//   conversationId?: string
//   replyTo?: string
// }

// export type TextMessageRequest = BaseMessageRequest & {
//   type: "text"
//   text: string
// }

// export type MediaAttachment = {
//   url: string
//   fileName: string
//   fileSize: number
//   mimeType: string
// }

// export type MediaMessageRequest = BaseMessageRequest & {
//   type: "image" | "video" | "audio"
//   text?: string
//   attachments: MediaAttachment[]
// }

// export type SendMessageRequest = TextMessageRequest | MediaMessageRequest

// export interface AttachmentType {
//   url: string
//   fileName: string
//   fileSize: number
//   mimeType: string
// }

// export interface ReactionType {
//   user: string
//   emoji: string
// }

// export interface MessageType {
//   _id: string
//   conversationId: string
//   senderId: string

//   type: "text" | "image" | "video" | "audio" | "sticker" | "system"

//   text?: string
//   attachments?: AttachmentType[]
//   sticker?: string

//   reactions: ReactionType[]
//   readBy: string[]

//   isBlur?: boolean

//   edited: boolean
//   editedAt?: string

//   replyTo?: string

//   createdAt: string
//   updatedAt: string
// }

// export interface ConversationMemberType {
//   user: string
//   role: "member" | "admin"
//   joinedAt: string
// }

// export interface ConversationType {
//   _id: string

//   type: "private" | "group"

//   title?: string
//   description?: string
//   avatar?: string

//   owner?: string

//   members: ConversationMemberType[]

//   lastMessageId?: string
//   lastActivityAt: string

//   createdAt: string
//   updatedAt: string
// }

// export interface SendMessageResponse {
//   conversation: ConversationType
//   message: MessageType
// }
