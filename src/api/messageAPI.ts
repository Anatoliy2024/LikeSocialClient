// import { SendMessageRequest, SendMessageResponse } from "@/types/message"
// import instance from "./instance"

// export const messageAPI = {
//   /**
//    * Отправка сообщения любого типа
//    * Автоматически создаёт диалог, если это первое личное сообщение
//    */
//   sendMessage: async (data: SendMessageRequest) => {
//     return instance
//       .post<SendMessageResponse>("/api/messages", data)
//       .then((res) => res.data)
//   },

//   /**
//    * Вспомогательный метод для отправки только текста (самый частый кейс)
//    */
//   sendTextMessage: async (params: {
//     recipientId?: string
//     conversationId?: string
//     text: string
//     replyTo?: string
//   }) => {
//     return messageAPI.sendMessage({
//       type: "text",
//       ...params,
//     })
//   },

//   /**
//    * Вспомогательный метод для отправки медиа
//    */
//   sendMediaMessage: async (params: {
//     recipientId?: string
//     conversationId?: string
//     type: "image" | "video" | "audio"
//     attachments: Array<{
//       url: string
//       fileName: string
//       fileSize: number
//       mimeType: string
//     }>
//     caption?: string
//     replyTo?: string
//   }) => {
//     return messageAPI.sendMessage({
//       type: params.type,
//       text: params.caption,
//       attachments: params.attachments,
//       recipientId: params.recipientId,
//       conversationId: params.conversationId,
//       replyTo: params.replyTo,
//     })
//   },
//   //   sendMessage: async (data: {
//   //     recipientId?: string
//   //     conversationId?: string
//   //     content: string
//   //   }) => {
//   //     return instance.post("/api/messages", data).then((res) => res.data)
//   //   },
// }
