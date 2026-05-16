// lib/storage.ts

// Рекурсивный подсчёт размера папки
async function getDirSize(
  dirHandle: FileSystemDirectoryHandle,
): Promise<number> {
  let total = 0
  // @ts-ignore
  for await (const [, handle] of dirHandle.entries()) {
    if (handle.kind === "file") {
      const file = await handle.getFile()
      total += file.size
    } else if (handle.kind === "directory") {
      total += await getDirSize(handle)
    }
  }
  return total
}

export interface TorrentFolder {
  name: string
  size: number // байты
  sizeText: string // "1.4 GB"
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB"
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

// Получить все папки с размерами
export async function getOPFSFolders(): Promise<TorrentFolder[]> {
  const root = await navigator.storage.getDirectory()
  const folders: TorrentFolder[] = []
  // @ts-ignore
  for await (const [name, handle] of root.entries()) {
    if (handle.kind === "directory") {
      const size = await getDirSize(handle)
      folders.push({ name, size, sizeText: formatBytes(size) })
    }
  }

  return folders.sort((a, b) => b.size - a.size) // сортировка по размеру
}

// Удалить конкретную папку
export async function deleteOPFSFolder(name: string): Promise<void> {
  const root = await navigator.storage.getDirectory()
  await root.removeEntry(name, { recursive: true })
}

// Удалить ВСЁ
export async function clearAllOPFS(): Promise<void> {
  const root = await navigator.storage.getDirectory()
  // @ts-ignore
  for await (const [name] of root.entries()) {
    await root.removeEntry(name, { recursive: true })
  }
}
