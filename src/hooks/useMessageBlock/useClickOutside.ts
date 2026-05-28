import { Dispatch, SetStateAction, useEffect, useRef } from "react"

export const useClickOutside = (
  setShowOption: Dispatch<SetStateAction<boolean>>,
) => {
  const optionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionRef.current && !optionRef.current.contains(e.target as Node)) {
        setShowOption(false)
        // closeShowOptionHandler()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return optionRef
}
