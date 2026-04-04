import { Cell } from "@/types/zombicide"
import instance from "./instance"

export const zombicideAPI = {
  getRooms() {
    return instance.get(`games/zombicide`).then((response) => response.data)
  },
  createRoom(name: string, mapId: string, maxPlayersL: number) {
    return instance
      .post(`games/zombicide/create-game`, { name, mapId, maxPlayersL })
      .then((response) => response.data)
  },
  joinRoom(roomId: string) {
    return instance
      .post(`games/zombicide/${roomId}/join-room`)
      .then((response) => response.data)
  },
  getMyMaps(page: number, limit?: number) {
    return instance
      .get(`games/zombicide/get-my-maps`, { params: { page, limit } })
      .then((response) => response.data)
  },
  getMaps(page: number, limit?: number) {
    return instance
      .get(`games/zombicide/get-maps`, { params: { page, limit } })
      .then((response) => response.data)
  },
  getMapById(id: string) {
    return instance
      .get(`games/zombicide/get-map/${id}`)
      .then((response) => response.data)
  },
  saveMap(name: string, cols: number, rows: number, cells: Cell[]) {
    return instance
      .post(`games/zombicide/save-map`, { name, cols, rows, cells })
      .then((response) => response.data)
  },
}
