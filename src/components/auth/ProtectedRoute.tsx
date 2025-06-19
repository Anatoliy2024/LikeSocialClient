// // components/auth/ProtectedRoute.tsx
// "use client"
// import { useSelector } from "react-redux"
// import { useRouter } from "next/navigation"
// import { useEffect } from "react"
// import { RootState } from "@/store/store"

// type Props = {
//   children: React.ReactNode
// }

// export default function ProtectedRoute({ children }: Props) {
//   const router = useRouter()
//   const { isAuth, isVerified, authLoading } = useSelector(
//     (state: RootState) => state.auth
//   )

//   useEffect(() => {
//     if (!authLoading) {
//       if (!isAuth) {
//         router.replace("/auth/register") // если не авторизован
//       } else if (!isVerified) {
//         router.replace("/auth/verify") // если не верифицирован
//       }
//     }
//   }, [isAuth, isVerified, authLoading, router])

//   if (authLoading) return <div>Загрузка...</div> // или спиннер

//   return <>{children}</>
// }
