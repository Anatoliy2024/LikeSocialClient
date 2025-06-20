import { userPostType } from "@/store/slices/userPostsSlice"
import instance from "./instance"
import { roomPostType } from "@/store/slices/roomPostsSlice"
import { ProfileType } from "@/store/thunks/profileThunk"

export const authAPI = {
  // getMyInfo() {
  //   return instance.get("auth/me").then((response) => response.data)
  // },
  register(username: string, email: string, password: string) {
    return instance
      .post("auth/register", {
        username: username,
        email: email,
        password: password,
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
  getAllUsers() {
    return instance.get("user/all").then((res) => res.data)
  },
  getMyFriendsId() {
    return instance.get("user/myFriendsId").then((res) => res.data)
  },
  requestFriend(userId: string) {
    return instance
      .post("user/requestFriend", { userId })
      .then((res) => res.data)
  },
  acceptFriend(userId: string) {
    return instance
      .post("user/acceptFriend", { userId })
      .then((response) => response.data)
  },
  delFriend(userId: string) {
    return instance
      .post("user/delFriend", { userId })
      .then((response) => response.data)
  },
  cancelFriendRequest(userId: string) {
    return instance
      .post("user/cancelFriendRequest", { userId })
      .then((response) => response.data)
  },

  getUserRelations(type: string) {
    return instance
      .get(`user/getUserRelations`, { params: { type } })
      .then((res) => res.data)
  },
}

export const postAPI = {
  createUserPost(data: Partial<userPostType>) {
    return instance
      .post("userPosts/create", data)
      .then((response) => response.data)
  },
  getUserPost() {
    return instance.get("userPosts").then((response) => response.data)
  },
  delUserPost(postId: string) {
    return instance
      .delete(`userPosts/${postId}`)
      .then((response) => response.data)
  },
  getUserPostsByUserId(userId: string) {
    return instance.get(`/userPosts/${userId}`).then((res) => res.data)
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
  getRoomPosts(roomId: string) {
    //?page=1&limit=10
    //  .get(`roomPosts/${roomId}`, { params })
    return instance.get(`roomPosts/${roomId}`).then((response) => response.data)
  },
  delRoomPost(postId: string, roomId: string) {
    // /post/:postId
    return instance
      .delete(`roomPosts/post/${postId}?roomId=${roomId}`)
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
  getRooms() {
    return instance.get(`room/getRooms`).then((response) => response.data)
  },
  getMembersFromRoom(roomId: string) {
    return instance
      .get(`room/getMembers/${roomId}`)
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
  delRoom(roomId: string) {
    return instance
      .delete(`room/delRoom/${roomId}`)
      .then((response) => response.data)
  },
  leaveRoom(roomId: string) {
    return instance
      .delete(`room/leaveRoom/${roomId}`)
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
