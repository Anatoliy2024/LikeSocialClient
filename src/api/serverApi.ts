import { headers } from "next/headers"

export async function serverAuthAPI() {
  const incomingHeaders = headers()
  const cookie = incomingHeaders.get("cookie") || "" // <- получишь refreshToken тут
  console.log("refresh cooke", cookie)

  const res = await fetch(`${process.env.API_URL}/auth/check`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      cookie, // <- передаёшь куки на бэкенд
    },
    credentials: "include",
    cache: "no-store",
  })

  return res
}

// import { cookies } from "next/headers"

// const url =
//   process.env.API_URL ||
//   (process.env.NODE_ENV === "development"
//     ? "http://localhost:5000/api/"
//     : "https://likesocial.onrender.com/api/")

// console.log("API_URL:", process.env.API_URL)
// console.log("NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL)

// export const serverAuthAPI = {
//   async check() {
//     const cookieStore = await cookies() // ✅ await нужен в новой версии

//     const refreshToken = cookieStore.get("refreshToken")?.value

//     if (!refreshToken) {
//       console.log("❌ Нет куки refreshToken")
//     } else {
//       console.log("✅ Найден refreshToken:", refreshToken)
//     }

//     return await fetch(`${url}auth/check`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         cookie: `refreshToken=${refreshToken}`, // ✅ вручную вставляем куку
//       },
//       credentials: "include",
//       cache: "no-store",
//     })
//   },
// }

// import { cookies } from "next/headers"

// const url =
//   process.env.API_URL || // 👈 без NEXT_PUBLIC
//   (process.env.NODE_ENV === "development"
//     ? "http://localhost:5000/api/"
//     : "https://likesocial.onrender.com/api/")
// export const serverAuthAPI = {
//   async check() {
//     const cookieStore =  cookies()
//     const cookieString = cookieStore
//       .getAll()
//       .map((c) => `${c.name}=${c.value}`)
//       .join("; ")

//     // const cookieString = (await cookies())
//     //   .getAll()
//     //   .map((c) => `${c.name}=${c.value}`)
//     //   .join("; ")
//     console.log("Отправляем cookie:", cookieString)
//     return await fetch(`${url}auth/check`, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         cookie: cookieString, // 👈 передаём cookie вручную
//       },
//       credentials: "include", // ✅ обязательно
//       cache: "no-store",
//     })
//   },
// }
