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
  getMyMaps() {
    return instance
      .get(`games/zombicide/get-my-maps`)
      .then((response) => response.data)
  },
  saveMap(name: string, cols: number, rows: number, zones: unknown) {
    return instance
      .post(`games/zombicide/save-map`, { name, cols, rows, zones })
      .then((response) => response.data)
  },
}
