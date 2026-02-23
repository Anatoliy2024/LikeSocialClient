import imageCompression from "browser-image-compression"

export const compressImage = async (file: File) => {
  const options = {
    maxWidthOrHeight: 1200,
    maxSizeMB: 1,
    initialQuality: 1,
    useWebWorker: true,
  }

  return await imageCompression(file, options)
}
