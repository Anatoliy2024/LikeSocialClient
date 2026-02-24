import instance from "./instance"

export const adminAPI = {
  createTestUser(username: string) {
    return instance
      .post("admin/create-test-user", { username })
      .then((res) => res.data)
  },
}
