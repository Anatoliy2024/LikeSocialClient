import instance from "./instance"

export const notificationsAPI = {
  fetchNotifications() {
    return instance.get("notifications").then((res) => res.data)
  },
  markAllNotificationsRead() {
    return instance
      .patch("notifications/markAsRead", null)
      .then((res) => res.data)
  },

  deleteNotification(id: string) {
    return instance.delete(`notifications/${id}`).then((res) => res.data)
  },
  deleteAllNotifications() {
    return instance.delete("notifications").then((res) => res.data)
  },
}
