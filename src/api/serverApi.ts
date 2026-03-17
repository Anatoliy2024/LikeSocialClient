import instance from "./instance"

export const serverAPI = {
  statusServer() {
    return instance.get("server/serverStatus").then((response) => response.data)
  },
  getTik() {
    return instance.get("tik").then((response) => response.data)
  },
}
