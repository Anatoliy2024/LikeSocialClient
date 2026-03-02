import instance from "./instance"

export const conversationAPI = {
  // Приватный диалог: создать или получить (POST с body)
  // createOrGetPrivate(recipientId: string) {
  //   return instance
  //     .post<ConversationType>("conversations/private", { recipientId })
  //     .then((res) => res.data)
  // },

  // Создание группы (POST с body)
  createGroup(
    title: string,
    memberIds: string[],
    avatar?: string,
    description?: string
  ) {
    return instance
      .post("conversations/group", {
        title,
        memberIds,
        description,
        avatar,
      })
      .then((res) => res.data)
  },

  // Получение всех чатов
  getAll(page: number, limit?: number) {
    return instance
      .get("conversations", {
        params: { page, limit },
      })
      .then((res) => res.data)
  },
  // Получение всех чатов
  getCurrentConversation(conversationId: string) {
    return instance
      .get(`conversations/${conversationId}/conversation`)
      .then((res) => res.data)
  },

  getMessages: (
    conversationId: string,
    direction = "initial",
    cursor?: string,
    limit = 20
  ) => {
    const params = new URLSearchParams({ direction, limit: String(limit) })
    if (cursor) params.append("cursor", cursor)
    return instance
      .get(`/conversations/${conversationId}/messages?${params}`)
      .then((r) => r.data)
  },
  // // Получение сообщений чата с пагинацией
  // getMessages(conversationId: string, page: number, limit?: number) {
  //   // console.log("getMessages***", conversationId)
  //   return instance
  //     .get(`conversations/${conversationId}/messages`, {
  //       params: { page, limit },
  //     })
  //     .then((res) => res.data)
  // },

  delConversation(conversationId: string) {
    // console.log("getMessages***", conversationId)
    return instance
      .delete(`conversations/${conversationId}`)
      .then((res) => res.data)
  },

  // Получение сообщений чата с пагинацией
  delHistoryMessages(conversationId: string) {
    // console.log("getMessages***", conversationId)
    return instance
      .delete(`conversations/${conversationId}/messages`)
      .then((res) => res.data)
  },

  addMemberToGroup(conversationId: string, members: string[]) {
    // console.log("getMessages***", conversationId)
    return instance
      .post(`conversations/${conversationId}/members`, { members })
      .then((res) => res.data)
  },
  deleteMemberToGroup(conversationId: string, memberId: string) {
    // console.log("getMessages***", conversationId)
    return instance
      .delete(`conversations/${conversationId}/members/${memberId}`)
      .then((res) => res.data)
  },
  // Маркер "прочитано" (опционально)
  markAsRead(conversationId: string, messageId: string) {
    return instance
      .post(`conversations/${conversationId}/read`, { messageId })
      .then((res) => res.data)
  },
}
