import { userPostType } from "@/store/slices/userPostsSlice"
import instance from "./instance"
import { roomPostType } from "@/store/slices/roomPostsSlice"
import { ProfileType } from "@/store/thunks/profileThunk"
import { createUserMovieType } from "@/store/thunks/userMoviesThunk"

export const authAPI = {
  // getMyInfo() {
  //   return instance.get("auth/me").then((response) => response.data)
  // },
  register(
    username: string,
    email: string,
    password: string,
    inviteKey: string
  ) {
    return instance
      .post("auth/register", {
        username: username,
        email: email,
        password: password,
        inviteKey: inviteKey,
      })

      .then((response) => {
        const data = response.data
        localStorage.setItem("accessToken", data.accessToken) // ⬅️ сохраняем

        return data
      })
    // .then((response) => response.data)
  },
  auth(username: string, password: string) {
    return instance
      .post("auth/auth", {
        username: username,
        password: password,
      })
      .then((response) => {
        const data = response.data
        localStorage.setItem("accessToken", data.accessToken) // ⬅️ сохраняем

        return data
      })
    // .then((response) => response.data)
  },
  verify(username: string, passwordVerify: string) {
    return instance
      .post("auth/verify", {
        username: username,
        passwordVerify,
      })
      .then((response) => response.data)
  },
  me() {
    return instance.get("auth/me").then((response) => response.data)
  },

  postLogout() {
    return instance.post("auth/logout").then((response) => response.data)
  },
  forgotPassword(email: string) {
    return instance
      .post("auth/forgot-password", { email })
      .then((response) => response.data)
  },

  resetPassword(token: string, password: string) {
    return instance
      .post("auth/reset-password", {
        token,
        newPassword: password,
      })
      .then((response) => response.data)
  },
  // const res = await fetch('http://localhost:5000/api/auth/reset-password', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ token, newPassword: password }),
  // })
}

export const userAPI = {
  //profile
  getUserInfo(id: string) {
    return instance.get(`user/${id}`).then((response) => response.data)
  },
  updateMyProfile(data: { userInfo: ProfileType }) {
    return instance.put("user/myProfileInfo", data).then((res) => res.data)
  },
  //users
  getAllUsers(page: number, limit?: number) {
    return instance
      .get("user/all", { params: { page, limit } })
      .then((res) => res.data)
  },
  getMyFriendsId() {
    return instance.get("user/myFriendsId").then((res) => res.data)
  },
  requestFriend(userId: string, page: number, limit?: number) {
    return instance
      .post("user/requestFriend", { userId }, { params: { page, limit } })
      .then((res) => res.data)
  },
  acceptFriend(userId: string, page: number, limit?: number) {
    return instance
      .post("user/acceptFriend", { userId }, { params: { page, limit } })
      .then((response) => response.data)
  },
  delFriend(userId: string, page: number, limit?: number) {
    return instance
      .post("user/delFriend", { userId }, { params: { page, limit } })
      .then((response) => response.data)
  },
  cancelFriendRequest(userId: string, page: number, limit?: number) {
    return instance
      .post("user/cancelFriendRequest", { userId }, { params: { page, limit } })
      .then((response) => response.data)
  },

  getUserRelations(type: string, page: number, limit?: number) {
    return instance
      .get(`user/getUserRelations`, { params: { type, page, limit } })
      .then((res) => res.data)
  },
  subscribeToUser(userId: string) {
    return instance.post(`user/subscribe`, { userId }).then((res) => res.data)
  },
  unsubscribeFromUser(userId: string) {
    return instance.post(`user/unsubscribe`, { userId }).then((res) => res.data)
  },
}

export const postAPI = {
  createUserPost(data: Partial<userPostType>) {
    return instance
      .post("userPosts/create", data)
      .then((response) => response.data)
  },
  getUserPost(page: number, limit?: number) {
    return instance
      .get("userPosts", {
        params: { page, limit },
      })
      .then((response) => response.data)
  },
  getUserPostsByUserId(userId: string, page: number, limit?: number) {
    return instance
      .get(`/userPosts/${userId}`, {
        params: { page, limit },
      })
      .then((res) => res.data)
  },
  delUserPost(postId: string, page: number, limit?: number) {
    return instance
      .delete(`userPosts/${postId}`, {
        params: { page, limit },
      })
      .then((response) => response.data)
  },
  createUserComment(postId: string, comment: string) {
    return instance
      .post("userPosts/createComment", { postId, comment })
      .then((response) => response.data)
  },
  // createUserVoice(data) {
  //   return instance
  //     .post("userPosts/createVoice", data)
  //     .then((response) => response.data)
  // },
}
export const roomPostAPI = {
  createRoomPost(data: Partial<roomPostType>) {
    return instance
      .post("roomPosts/create", data)
      .then((response) => response.data)
  },
  getRoomPosts(roomId: string, page: number, limit?: number) {
    //?page=1&limit=10
    //  .get(`roomPosts/${roomId}`, { params })
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
    limit?: number
  ) {
    // /post/:postId
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
  // createRoomVoice(data) {
  //   return instance
  //     .post("roomPosts/createVoice", data)
  //     .then((response) => response.data)
  // },
}

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
    // console.log("delFriendFromRoom userId", userId)

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

export const voiceAPI = {
  createVoice(data: Record<string, string | null | Record<string, number>>) {
    return instance
      .post(`posts/${data.postId}/voices`, data)
      .then((response) => response.data)
  },
  getVoice(postId: string) {
    return instance
      .get(`posts/${postId}/voices`)
      .then((response) => response.data)
  },
}
export const serverAPI = {
  statusServer() {
    return instance.get("server/serverStatus").then((response) => response.data)
  },
  getTik() {
    return instance.get("tik").then((response) => response.data)
  },
}

export const fileAPI = {
  uploadUserAvatar(file: File) {
    const formData = new FormData()
    formData.append("image", file)

    return instance
      .post("file/uploadUserAvatar", formData)
      .then((res) => res.data)
  },
  uploadRoomAvatar(file: File, roomId: string) {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("roomId", roomId) // передаём roomId в FormData
    return instance
      .post("file/uploadRoomAvatar", formData)
      .then((res) => res.data)
  },
  uploadRoomPostAvatar(file: File, postId: string) {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("postId", postId) // передаём roomId в FormData
    return instance
      .post("file/uploadRoomPostAvatar", formData)
      .then((res) => res.data)
  },
  uploadUserPostAvatar(file: File, postId: string) {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("postId", postId) // передаём roomId в FormData
    return instance
      .post("file/uploadUserPostAvatar", formData)
      .then((res) => res.data)
  },

  uploadUserMovieAvatar(file: File, userMovieId: string, status: string) {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("userMovieId", userMovieId) // передаём roomId в FormData
    formData.append("status", status) // передаём roomId в FormData
    return instance
      .post("file/uploadUserMovieAvatar", formData)
      .then((res) => res.data)
  },

  // uploadUserPostImage({ file, postId }: { file: File; postId: string }) {
  //   const formData = new FormData()
  //   formData.append("image", file)
  //   formData.append("postId", postId)

  //   return instance.post("/api/file/upload-user-post", formData).then(res => res.data)
  // }

  // changeAvatar({
  //   file,
  //   userId,
  //   roomId,
  //   postRoomId,
  //   postUserId
  // }: {
  //   file: File
  //   userId?: string
  //   roomId?: string
  //   postRoomId?: string
  //   postUserId?: string
  // }) {
  //   const formData = new FormData()
  //   formData.append("image", file)

  //   if (userId) formData.append("userId", userId)
  //   if (roomId) formData.append("roomId", roomId)
  //   if (postUserId) formData.append("postUserId", postUserId)
  //   if (postRoomId) formData.append("postRoomId", postRoomId)
  //   return instance
  //     .post("/api/file/upload", formData)
  //     .then((response) => response.data)
  // },
}
export const userMovieAPI = {
  createUserMovie(data: createUserMovieType) {
    return instance
      .post("user-movie/create-user-movie", data)
      .then((res) => res.data)
  },

  // , {
  //   data: { status: "wantToSee" }, // передаём текущий таб
  // }

  deleteUserMovie(
    userMovieId: string,
    status: "wantToSee" | "watched",
    page: number,
    limit?: number
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
    limit?: number
  ) {
    return instance
      .patch(`user-movie/update-status/${userMovieId}`, {
        status,
        params: { page, limit },
      })
      .then((res) => res.data)
  },

  // userMovies/update-status/${userMovieId}
  // watchedUserMovie(userMovieId) {
  //   return instance
  //     .post("/user-movie/watched-user-movie", { userMovieId })
  //     .then((res) => res.data)
  // },

  getMyWantToSeeMovies(page: number, limit?: number) {
    return instance
      .get("user-movie/my/want-to-see", { params: { page, limit } })
      .then((res) => res.data)
  },

  getMyWatchedMovies(page: number, limit?: number) {
    return instance
      .get("user-movie/my/watched", { params: { page, limit } })
      .then((res) => res.data)
  },

  getPublicWantToSeeMovies(userId: string, page: number, limit?: number) {
    return instance
      .get(`user-movie/${userId}/public/want-to-see`, {
        params: { page, limit },
      })
      .then((res) => res.data)
  },

  getPublicWatchedMovies(userId: string, page: number, limit?: number) {
    return instance
      .get(`user-movie/${userId}/public/watched`, { params: { page, limit } })
      .then((res) => res.data)
  },
}

export const notificationsAPI = {
  fetchNotifications() {
    return instance.get("notifications").then((res) => res.data)
  },
  markAllNotificationsRead() {
    return instance
      .patch("notifications/markAsRead", null)
      .then((res) => res.data)
  },
  // createNotification(notificationData) {
  //   return instance
  //     .post("/api/notifications", notificationData)
  //     .then((res) => res.data)
  // },
  deleteNotification(id: string) {
    return instance.delete(`notifications/${id}`).then((res) => res.data)
  },
  deleteAllNotifications() {
    return instance.delete("notifications").then((res) => res.data)
  },
}
