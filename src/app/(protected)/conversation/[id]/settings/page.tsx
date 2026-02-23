import { SettingsGroup } from "@/components/SettingsGroup/SettingsGroup"
import { Suspense } from "react"

export default function SettingsGroupPage() {
  return (
    <Suspense>
      <SettingsGroup />
    </Suspense>
  )
}
