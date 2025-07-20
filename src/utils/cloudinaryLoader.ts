export const cloudinaryLoader = ({
  src,
  width,
}: {
  src: string
  width: number
}) => {
  // src — базовый URL без параметров
  // width — требуемая ширина от Next.js
  const splitStr = "/upload/"
  const [prefix, suffix] = src.split(splitStr)
  return `${prefix}${splitStr}w_${width},q_auto,f_auto,c_limit/${suffix}`
}
