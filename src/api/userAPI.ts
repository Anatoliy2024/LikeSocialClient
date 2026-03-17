import { ProfileType } from "@/store/thunks/profileThunk"
import instance from "./instance"
import { PushSubscriptionJSON } from "@/lib/push-client"

export const userAPI = {
  //profile
  getUserInfo(id: string) {
    return instance.get(`user/${id}`).then((response) => response.data)
  },
  updateMyProfile(data: { userInfo: ProfileType }) {
    return instance.put("user/myProfileInfo", data).then((res) => res.data)
  },
  //users
  getAllUsers(page: number, limit?: number) {
    return instance
      .get("user/all", { params: { page, limit } })
      .then((res) => res.data)
  },
  getMyFriendsId() {
    return instance.get("user/myFriendsId").then((res) => res.data)
  },
  requestFriend(
    userId: string,
    page?: number,
    profile?: string,
    limit?: number,
  ) {
    return instance
      .post(
        "user/requestFriend",
        { userId },
        { params: { page, limit, profile } },
      )
      .then((res) => res.data)
  },
  acceptFriend(
    userId: string,
    page?: number,
    profile?: string,
    limit?: number,
  ) {
    return instance
      .post(
        "user/acceptFriend",
        { userId },
        { params: { page, limit, profile } },
      )
      .then((response) => response.data)
  },
  delFriend(userId: string, page?: number, profile?: string, limit?: number) {
    return instance
      .post("user/delFriend", { userId }, { params: { page, limit, profile } })
      .then((response) => response.data)
  },
  cancelFriendRequest(
    userId: string,
    page?: number,
    profile?: string,
    limit?: number,
  ) {
    return instance
      .post(
        "user/cancelFriendRequest",
        { userId },
        { params: { page, limit, profile } },
      )
      .then((response) => response.data)
  },
  getUserStatus(userId: string) {
    return instance.get(`user/getUserStatus/${userId}`).then((res) => res.data)
  },
  getUserRelations(type: string, page: number, limit?: number) {
    return instance
      .get(`user/getUserRelations`, { params: { type, page, limit } })
      .then((res) => res.data)
  },
  subscribeToUser(userId: string) {
    return instance.post(`user/subscribe`, { userId }).then((res) => res.data)
  },
  unsubscribeFromUser(userId: string) {
    return instance.post(`user/unsubscribe`, { userId }).then((res) => res.data)
  },
  getCallParticipant(userIds: string[] | string) {
    return instance
      .get(`user/userIds`, {
        params: { userIds },
        paramsSerializer: (params) => {
          return Object.entries(params)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return value
                  .map((v) => `${key}=${encodeURIComponent(v)}`)
                  .join("&")
              }
              return `${key}=${encodeURIComponent(value)}`
            })
            .join("&")
        },
      })
      .then((res) => res.data)
  },

  savePushSubscription(subscription: PushSubscriptionJSON) {
    return instance
      .post(`user/push-subscription/save`, { subscription })
      .then((res) => res.data)
  },

  getAllPushSubscription() {
    return instance.get("user/push-subscriptions").then((res) => res.data)
  },
  deletePushDevice(deviceId: string) {
    return instance
      .delete(`user/push-subscription/${deviceId}`)
      .then((res) => res.data)
  },
}
