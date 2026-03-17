import instance from "./instance"

export const roomPostAPI = {
  createRoomPost(data: FormData) {
    return instance
      .post("roomPosts/create", data)
      .then((response) => response.data)
  },
  updateRoomPost(data: FormData) {
    return instance
      .put("roomPosts/update", data)
      .then((response) => response.data)
  },
  getRoomPosts(roomId: string, page: number, limit?: number) {
    return instance
      .get(`roomPosts/${roomId}`, {
        params: { page, limit },
      })
      .then((response) => response.data)
  },
  delRoomPost(
    postId: string,
    roomId: string | null,
    page: number,
    limit?: number,
  ) {
    return instance
      .delete(`roomPosts/post/${postId}?roomId=${roomId}`, {
        params: { page, limit },
      })
      .then((response) => response.data)
  },
  createRoomComment(postId: string, roomId: string, comment: string) {
    return instance
      .post("roomPosts/createComment", { postId, roomId, comment })
      .then((response) => response.data)
  },
}
