import axios from "axios"

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/",
  withCredentials: true, // важно: чтобы кука с refreshToken передавалась
})

// 👉 Добавляем accessToken в заголовок перед каждым запросом
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 👉 Добавляем обработку ошибки (если accessToken просрочен)
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Если accessToken просрочен
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true

      try {
        const res = await instance.post("/auth/refresh") // с withCredentials
        const newAccessToken = res.data.accessToken
        localStorage.setItem("accessToken", newAccessToken)

        // Повтор запроса с новым токеном
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return instance(originalRequest)
      } catch (refreshError) {
        console.error("Refresh token недействителен Instance")
        // например: выкидываем пользователя
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default instance
