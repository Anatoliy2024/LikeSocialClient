import instance from "./instance"

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
  uploadGroupAvatar(file: File, groupId: string) {
    const formData = new FormData()
    formData.append("image", file)
    formData.append("groupId", groupId) // передаём roomId в FormData
    return instance
      .post("file/uploadGroupAvatar", formData)
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

  uploadChatImage(file: File) {
    const formData = new FormData()
    formData.append("image", file)

    return instance
      .post("file/uploadChatImage", formData)
      .then((res) => res.data)
  },
}
