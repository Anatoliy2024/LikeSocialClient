// import type { NextApiRequest, NextApiResponse } from "next"
// import axios, { AxiosError } from "axios"
// import { baseURL } from "../../../api/instance"
// // import cookie from "cookie"

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   try {
//     const cookies = req.headers.cookie
//     console.log("cookies", cookies)
//     // Проксируем запрос на бекенд
//     const response = await axios.post(
//       baseURL + "/auth/refresh",
//       //   "https://likesocial.onrender.com/api/auth/refresh",
//       {},
//       {
//         headers: {
//           cookie: cookies || "", // пересылаем куки
//         },
//         withCredentials: true,
//       }
//     )

//     // Пересылаем accessToken клиенту
//     res.status(200).json(response.data)
//   } catch (err: unknown) {
//     const axiosError = err as AxiosError

//     console.error(
//       "Ошибка прокси /refresh",
//       axiosError.response?.data || axiosError.message
//     )

//     res.status(axiosError.response?.status || 500).json({
//       message: "Ошибка при обновлении токена",
//     })
//   }
// }
