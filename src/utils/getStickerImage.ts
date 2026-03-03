import { STICKERS } from "@/constants/stickers"

export const getStickerImage = (stickerId: string): string | undefined => {
  for (const pack of Object.values(STICKERS)) {
    const found = pack.find((s) => s.id === stickerId)
    if (found) return found.image
  }
  return undefined
}
