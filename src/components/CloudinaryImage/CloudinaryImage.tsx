import Image from "next/image"

type Props = {
  src: string // полный Cloudinary URL без параметров (чистый)
  alt: string

  className?: string
  style?: React.CSSProperties
  priority?: boolean
  width: number
  height: number
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
    />
  )
}

// const cloudinaryLoader = ({ src, width }: { src: string; width: number }) => {

//   const [prefix, suffix] = src.split("/upload/")
//   return `${prefix}/upload/w_${width},q_auto,f_auto,c_limit/${suffix}`
// }

// export const FixedSizeCloudinaryImage = ({
//   src,
//   alt,
//   //   size,
//   className,
//   style,
//   priority = false,
//   width,
//   height,
// }: Props) => {
//   return (
//     <Image
//       loader={cloudinaryLoader}
//       src={src}
//       alt={alt}
//       width={width}
//       height={height}
//       sizes={`${width}px`} // 👈 строго задаём нужную ширину
//       className={className}
//       style={style}
//       priority={priority}
//       loading={priority ? undefined : "lazy"}
//     />
//   )
// }
