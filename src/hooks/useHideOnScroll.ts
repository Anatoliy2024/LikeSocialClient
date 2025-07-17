import { useEffect, useRef, useState } from "react"
import throttle from "lodash.throttle"

export const useHideOnScroll = () => {
  const [showHeader, setShowHeader] = useState(true)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    const handleScroll = throttle(() => {
      const currentY = window.scrollY

      if (currentY > lastScrollYRef.current && currentY > 100) {
        setShowHeader(false)
      } else {
        setShowHeader(true)
      }

      lastScrollYRef.current = currentY
    }, 200)

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return showHeader
}
