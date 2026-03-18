import axios from "axios"

// Получаем базовый URL из env или fallback
export const baseApiUrl = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") // убираем слеш в конце, если есть
  : process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : "https://likesocial.onrender.com"

// Добавляем /api в конце
export const baseURL = baseApiUrl + "/api"
const instance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "X-Platform": "web",
  },
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
        // console.log("await instance.post('/auth/refresh')", res)
        // const res = await axios.post(
        //   "/api/proxy/refresh",
        //   {},
        //   { withCredentials: true }
        // )
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
  },
)

export default instance
