import instance from "./instance"

export const userMovieAPI = {
  createUserMovie(data: FormData) {
    return instance.post("user-movie/create", data).then((res) => res.data)
  },
  updateUserMovie(data: FormData, userMovieId: string) {
    return instance
      .put(`user-movie/update/${userMovieId}`, data)
      .then((res) => res.data)
  },
  addUserMovie(postId: string, roomId?: string) {
    return instance
      .post(`user-movie/add`, { postId, roomId })
      .then((res) => res.data)
  },

  deleteUserMovie(
    userMovieId: string,
    status: "wantToSee" | "watched",
    page: number,
    limit?: number,
  ) {
    return instance
      .delete(`user-movie/delete/${userMovieId}`, {
        data: { status }, // ⬅️ обязательно внутри data!
        params: { page, limit },
      })
      .then((res) => res.data)
  },

  updateUserMovieStatus(
    userMovieId: string,
    status: "wantToSee" | "watched",
    page: number,
    limit?: number,
  ) {
    return instance
      .patch(`user-movie/update-status/${userMovieId}`, {
        status,
        params: { page, limit },
      })
      .then((res) => res.data)
  },

  getUserMovies(params: {
    status: "wantToSee" | "watched"
    page: number
    limit?: number
    userId?: string
  }) {
    const { userId, ...query } = params

    const url = userId ? `user-movie/${userId}` : "user-movie/my-movies"

    return instance.get(url, { params: query }).then((res) => res.data)
  },
}
