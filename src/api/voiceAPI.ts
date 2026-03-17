import instance from "./instance"

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
