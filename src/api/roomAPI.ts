import instance from "./instance"

export const roomAPI = {
  createRoom(name: string, description: string | undefined) {
    return instance
      .post(`room/create`, { name, description })
      .then((response) => response.data)
  },
  getRooms(page: number, limit?: number) {
    return instance
      .get(`room/getRooms`, { params: { page, limit } })
      .then((response) => response.data)
  },
  getRoomById(roomId: string) {
    return instance
      .get(`room/getRoomById/${roomId}`)
      .then((response) => response.data)
  },
  addFriendsToRoom(users: string[], roomId: string) {
    return instance
      .post("room/addFriends", { users, roomId })
      .then((response) => response.data)
  },
  delFriendFromRoom(userId: string, roomId: string) {
    return instance
      .delete(`room/delFriend/${userId}?roomId=${roomId}`)
      .then((response) => response.data)
  },
  delRoom(roomId: string, page: number, limit?: number) {
    return instance
      .delete(`room/delRoom/${roomId}`, { params: { page, limit } })
      .then((response) => response.data)
  },
  leaveRoom(roomId: string, page: number, limit?: number) {
    return instance
      .delete(`room/leaveRoom/${roomId}`, { params: { page, limit } })
      .then((response) => response.data)
  },
}
