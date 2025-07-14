// import Image from "next/image"

// type Props = {
//   src: string
//   alt: string
//   width?: number
//   height?: number
//   sizes?: string
//   className?: string
// }
// const cloudinaryLoader = ({ src, width }: { src: string; width: number }) => {
//   // Если это локальный файл или другой источник, возвращаем как есть
//   if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
//     return src
//   }

//   const [prefix, suffix] = src.split("/upload/")
//   return `${prefix}/upload/w_${width},q_auto,f_auto,c_limit/${suffix}`
// }
// // export const cloudinaryLoader = ({
// //   src,
// //   width,
// // }: {
// //   src: string
// //   width: number
// // }) => {
// //   // src — базовый URL без параметров
// //   // width — требуемая ширина от Next.js
// //   const splitStr = "/upload/"
// //   const [prefix, suffix] = src.split(splitStr)
// //   return `${prefix}${splitStr}w_${width},q_auto,f_auto,c_limit/${suffix}`
// // }

// const CloudinaryImage12 = ({
//   src,
//   alt,
//   width = 800,
//   height = 800,
//   sizes = "(max-width: 600px) 100vw, 800px",
//   className,
// }: Props) => {
//   return (
//     <Image
//       loader={cloudinaryLoader}
//       src={src}
//       alt={alt}
//       width={width}
//       height={height}
//       sizes={sizes}
//       className={className}
//       priority={false}
//       loading="lazy"
//     />
//   )
// }
