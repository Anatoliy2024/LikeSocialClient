import instance from "./instance"

export const authAPI = {
  register(
    username: string,
    email: string,
    password: string,
    inviteKey: string,
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

  // postLogout(endpoint?: string) {
  //   return instance
  //     .post("auth/logout", { endpoint })
  //     .then((response) => response.data)
  // },
  postLogout({ endpoint }: { endpoint?: string }) {
    return instance
      .post("auth/logout", { endpoint })
      .then((response) => response.data)
  },
  // postLogout(data: { endpoint?: string; token: string | null }) {
  //   return instance
  //     .post("auth/logout", { endpoint: data.endpoint, token: data.token })
  //     .then((response) => response.data)
  // },
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
}
