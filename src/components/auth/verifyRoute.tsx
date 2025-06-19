// "use client"

// import { useSelector } from "react-redux"
// import { useRouter, usePathname } from "next/navigation"
// import { useEffect } from "react"
// import { RootState } from "@/store/store"

// type Props = {
//   children: React.ReactNode
// }

// export default function VerifyRoute({ children }: Props) {
//   const { isAuth, authLoading, isVerified } = useSelector(
//     (state: RootState) => state.auth
//   )
//   const router = useRouter()
//   const pathname = usePathname()

//   useEffect(() => {
//     if (!authLoading && isAuth && !isVerified && pathname !== "/verify") {
//       router.replace("/verify")
//     }
//   }, [isAuth, authLoading, router, pathname, isVerified])

//   if (authLoading) return <div>Загрузка...</div>

//   return <>{children}</>
// }
