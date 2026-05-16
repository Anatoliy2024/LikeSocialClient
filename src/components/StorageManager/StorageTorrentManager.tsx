// components/StorageManager.tsx
"use client"

import { useState, useEffect } from "react"
import {
  getOPFSFolders,
  deleteOPFSFolder,
  clearAllOPFS,
  TorrentFolder,
  formatBytes,
} from "@/lib/storageTorrent"

export function StorageTorrentManager() {
  const [folders, setFolders] = useState<TorrentFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSize, setTotalSize] = useState("")

  const load = async () => {
    setLoading(true)
    const data = await getOPFSFolders()
    setFolders(data)
    const total = data.reduce((acc, f) => acc + f.size, 0)
    setTotalSize(formatBytes(total))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (name: string) => {
    await deleteOPFSFolder(name)
    await load()
  }

  const handleClearAll = async () => {
    await clearAllOPFS()
    await load()
  }

  if (loading) return <p>Подсчёт...</p>

  return (
    <div>
      <div>
        <span>Занято: {totalSize}</span>
        <button onClick={handleClearAll}>🗑 Очистить всё</button>
      </div>

      {folders.length === 0 && <p>Хранилище пустое</p>}

      {folders.map((folder) => (
        <div key={folder.name}>
          <span>{folder.name}</span>
          <span>{folder.sizeText}</span>
          <button onClick={() => handleDelete(folder.name)}>Удалить</button>
        </div>
      ))}
    </div>
  )
}
