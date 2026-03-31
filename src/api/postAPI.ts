import instance from "./instance"

export const postAPI = {
  createUserPost(data: FormData) {
    return instance
      .post("userPosts/create", data)
      .then((response) => response.data)
  },
  updateUserPost(data: FormData) {
    return instance
      .put("userPosts/update", data)
      .then((response) => response.data)
  },
  getUserPost(page: number, searchName: string | null, limit?: number) {
    return instance
      .get("userPosts", {
        params: { page, limit, searchName },
      })
      .then((response) => response.data)
  },
  getUserPostsByUserId(
    userId: string,
    page: number,
    searchName: string | null,
    limit?: number,
  ) {
    return instance
      .get(`/userPosts/${userId}`, {
        params: { page, limit, searchName },
      })
      .then((res) => res.data)
  },
  delUserPost(
    postId: string,
    page: number,
    searchName: string | null,
    limit?: number,
  ) {
    return instance
      .delete(`userPosts/${postId}`, {
        params: { page, limit, searchName },
      })
      .then((response) => response.data)
  },
  createUserComment(postId: string, comment: string) {
    return instance
      .post("userPosts/createComment", { postId, comment })
      .then((response) => response.data)
  },
}
