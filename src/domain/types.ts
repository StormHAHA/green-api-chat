export type MessageDirection = 'incoming' | 'outgoing'

export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface Message {
  /** idMessage из GREEN-API, для ещё не отправленных - временный локальный id */
  id: string
  text: string
  direction: MessageDirection
  timestamp: number
  status?: MessageStatus
  senderName?: string
}

export interface Chat {
  /** Локальный идентификатор, не меняется за всё время жизни чата */
  id: string
  /** Идентификатор чата в GREEN-API, может уточниться после первого входящего */
  chatId: string
  phone?: string
  name?: string
  isGroup: boolean
  messages: Message[]
  unreadCount: number
  createdAt: number
}

export interface ChatState {
  chats: Chat[]
  activeLocalChatId: string | null
}

export interface ChatMessageEvent {
  direction: MessageDirection
  idMessage: string
  chatId: string
  chatName?: string
  isGroup: boolean
  senderName?: string
  senderPhone?: string
  text: string
  timestamp: number
}
