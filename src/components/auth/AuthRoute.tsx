// "use client"

// import { useSelector } from "react-redux"
// import { useRouter, usePathname } from "next/navigation"
// import { useEffect } from "react"
// import { RootState } from "@/store/store"

// type Props = {
//   children: React.ReactNode
// }

// export default function AuthRoute({ children }: Props) {
//   const { isAuth, authLoading } = useSelector((state: RootState) => state.auth)
//   const router = useRouter()
//   const pathname = usePathname()

//   useEffect(() => {
//     if (!authLoading && !isAuth && pathname !== "/register") {
//       router.replace("/register")
//     }
//   }, [isAuth, authLoading, router, pathname])

//   if (authLoading) return <div>Загрузка...</div>

//   return isAuth ? <>{children}</> : null
// }
