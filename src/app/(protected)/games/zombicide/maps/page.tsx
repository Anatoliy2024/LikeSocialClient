import { Suspense } from "react"
import Maps from "./Maps"

export default function MapsPage() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <Maps />
    </Suspense>
  )
}
