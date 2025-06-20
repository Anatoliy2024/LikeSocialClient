import { cookies } from "next/headers"

const url =
  process.env.API_URL || // 👈 без NEXT_PUBLIC
  (process.env.NODE_ENV === "development"
    ? "http://localhost:5000/api/"
    : "https://likesocial.onrender.com/api/")
export const serverAuthAPI = {
  async check() {
    const cookieStore = await cookies()
    const cookieString = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ")

    // const cookieString = (await cookies())
    //   .getAll()
    //   .map((c) => `${c.name}=${c.value}`)
    //   .join("; ")
    console.log("Отправляем cookie:", cookieString)
    return await fetch(`${url}auth/check`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieString, // 👈 передаём cookie вручную
      },
      credentials: "include", // ✅ обязательно
      cache: "no-store",
    })
  },
}
