import Image from "next/image"

type Props = {
  src: string // полный Cloudinary URL без параметров (чистый)
  alt: string

  className?: string
  style?: React.CSSProperties
  priority?: boolean
  width: number
  height: number
  onClick?: (e?: React.MouseEvent<HTMLImageElement>) => void
}
const cloudinaryLoader = ({ src, width }: { src: string; width: number }) => {
  // Если это локальный файл или другой источник, возвращаем как есть
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
    return src
  }

  const [prefix, suffix] = src.split("/upload/")
  return `${prefix}/upload/w_${width},q_auto,f_auto,c_limit/${suffix}`
}

export const CloudinaryImage = ({
  src,
  alt,
  width,
  height,
  className,
  style,
  priority = false,
  onClick,
}: Props) => {
  const url = cloudinaryLoader({ src, width })

  return (
    <Image
      src={url}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      unoptimized // отключаем оптимизацию Next.js, чтоб не менять URL
      sizes={`${width}px`}
      onClick={onClick}
    />
  )
}
