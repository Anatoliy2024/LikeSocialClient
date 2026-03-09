// // src/api/types.ts
// import { AxiosInstance } from 'axios'
// import { PushSubscriptionJSON } from '@/lib/push-client' // или правильный путь
// import { ProfileType } from '@/types/profile' // если у вас есть такой тип

// // Интерфейс для вашего userAPI
// export interface UserAPI {
//   // Методы от AxiosInstance (чтобы работали .get, .post и т.д.)
//   // Можно не прописывать все, если используете индексную сигнатуру ниже

//   // ✅ Ваши кастомные методы (примеры)
//   getUserInfo(id: string): Promise<any>
//   updateMyProfile(data: { userInfo: ProfileType }): Promise<any>
//   getAllUsers(page: number, limit?: number): Promise<any>
//   getMyFriendsId(): Promise<any>
//   requestFriend(userId: string, page?: number, profile?: string, limit?: number): Promise<any>
//   acceptFriend(userId: string, page?: number, profile?: string, limit?: number): Promise<any>
//   delFriend(userId: string, page?: number, profile?: string, limit?: number): Promise<any>
//   cancelFriendRequest(userId: string, page?: number, profile?: string, limit?: number): Promise<any>
//   getUserStatus(userId: string): Promise<any>
//   getUserRelations(type: string, page: number, limit?: number): Promise<any>
//   subscribeToUser(userId: string): Promise<any>
//   unsubscribeFromUser(userId: string): Promise<any>
//   getCallParticipant(userIds: string[] | string): Promise<any>

//   // ✅ Новые методы для Web Push
//   savePushSubscription(subscription: PushSubscriptionJSON): Promise<any>
//   removePushSubscription(): Promise<any>

//   // 🔥 Индексная сигнатура: разрешает любые другие методы (чтобы не описывать все)
//   [key: string]: any
// }
