import {
  OnlineStatus,
  OnlineStatusState,
} from "@/store/slices/onlineStatusSlice"
import { ConversationType, MessageType } from "./conversation.types"
import { Dispatch, RefObject, SetStateAction } from "react"
import { BaseMember } from "./base"

type ConfirmConfigType = {
  title: string
  message: string
  onConfirm: () => void
} | null

export interface UseMessageBlockReturn {
  // ─────────────────────────────────────────
  // 📦 ДАННЫЕ ИЗ STORE / REDUX
  // ─────────────────────────────────────────

  /** Текущая активная беседа (из conversations slice) */
  currentConversation: ConversationType | null

  /** Статус загрузки сообщений/беседы */
  loading: boolean

  /** Список сообщений текущего чата */
  messages: MessageType[]

  /** ID пользователя из auth slice */
  userId: string | null

  /** Состояние онлайн-статусов всех пользователей */
  usersOnline: OnlineStatusState

  // ─────────────────────────────────────────
  // 🎨 UI STATE (локальное состояние компонента)
  // ─────────────────────────────────────────

  /** Сообщение, для которого открыто контекстное меню (модалка) */
  activeMessage: MessageType | null | undefined

  /** Позиция контекстного меню относительно сообщения */
  messagePosition: {
    top: number
    left: number
    right: number
    isOwn: boolean
  } | null

  /** URL изображения для полноэкранного просмотра */
  fullImage: string | null

  /** Конфигурация модального окна подтверждения */
  confirmConfig: ConfirmConfigType

  /** Открыто ли меню опций беседы (три точки) */
  showOption: boolean

  /** Находимся ли мы в нижней части списка сообщений */
  isAtBottom: boolean

  /** Состояние режима редактирования сообщения */
  isEditMessage: {
    messageId: string
    isEdit: boolean
    text: string
  }

  // ─────────────────────────────────────────
  // ⚙️ ХЕНДЛЕРЫ / CALLBACKS
  // ─────────────────────────────────────────

  // --- Контекстное меню сообщения ---

  /** Закрыть контекстное меню сообщения */
  handleCloseCurrentMessage: () => void

  /** Обработать клик по сообщению (открыть меню) */
  handleCurrentMessage: (
    messageId: string,
    isOwn: boolean,
    e: React.MouseEvent,
  ) => void

  /** Добавить/удалить реакцию на сообщение */
  handleReaction: (messageId: string, reactionId: string) => void

  /** Удалить сообщение через сокет */
  handleDeleteMessage: (messageId: string) => void

  /** Войти в режим редактирования сообщения */
  handleShowEditMessage: (messageId: string, text?: string) => void

  // --- Изображения ---

  /** Открыть изображение на весь экран */
  setFullImage: Dispatch<SetStateAction<string | null>>

  // --- Модальное окно подтверждения ---

  /** Закрыть модальное окно подтверждения */
  closeConfirm: () => void

  /** Открыть модальное окно подтверждения с конфигами */
  openConfirm: (config: ConfirmConfigType) => void

  // --- Меню опций беседы ---

  /** Переключить видимость меню опций */
  setShowOption: Dispatch<SetStateAction<boolean>>

  // --- Действия с беседой ---

  /** Удалить текущую беседу (с роутингом) */
  delConversation: () => void

  /** Очистить историю сообщений беседы */
  delHistoryMessages: () => void

  // --- Редактирование сообщения ---

  /** Выйти из режима редактирования */
  handleCloseEditMessage: () => void

  // --- Скролл ---

  /** Программно проскроллить вниз к последнему сообщению */
  scrollToBottom: () => void

  // ─────────────────────────────────────────
  // 🎯 ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ / DERIVED STATE
  // ─────────────────────────────────────────

  /** Является ли текущая беседа групповой */
  isGroup: boolean

  /** Является ли текущий пользователь владельцем группы */
  isOwner: boolean

  /** Собеседник в приватном чате (если не группа) */
  recipientId: BaseMember | undefined

  /** Онлайн-статус собеседника */
  status: OnlineStatus

  /** ID первого непрочитанного сообщения (для разделителя) */
  firstUnreadMessageId: string | null

  /** Есть ли ещё более старые сообщения для подгрузки */
  hasMoreOlder: boolean

  // ─────────────────────────────────────────
  // 🔗 REFS (ссылки на DOM-элементы и мутабельные значения)
  // ─────────────────────────────────────────

  // --- DOM рефы ---

  /** Контейнер списка сообщений (для скролла и IntersectionObserver) */
  messagesContainerRef: RefObject<HTMLDivElement | null>

  /** Элемент-якорь в конце списка (для скролла вниз) */
  messagesEndRef: RefObject<HTMLDivElement | null>

  /** Элемент-сенсор сверху для подгрузки старых сообщений */
  topSentinelRef: RefObject<HTMLDivElement | null>

  /** Контейнер меню опций (для useClickOutside) */
  optionRef: RefObject<HTMLDivElement | null>

  /** Разделитель "Новые сообщения" */
  dividerRef: RefObject<HTMLDivElement | null>

  // --- Mutable refs (хранилища для значений без ре-рендера) ---

  /** Кэшированный ID последнего прочитанного сообщения на момент инициализации */
  initialLastReadIdRef: RefObject<string | null | undefined>
}
