export type MessageDirection = 'incoming' | 'outgoing'

export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface Message {
  id: string
  text: string
  direction: MessageDirection
  timestamp: number
  status?: MessageStatus
  senderName?: string
}

export interface Chat {
  id: string
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
  activeChatId: string | null
}

export interface MessageEvent {
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
