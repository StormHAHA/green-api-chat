import { formatPhone } from './phone'
import type { Chat } from './types'

export function getChatTitle(chat: Chat): string {
  if (chat.name) return chat.name
  if (chat.phone) return formatPhone(chat.phone)
  return chat.chatId
}

export function getChatSubtitle(chat: Chat): string | null {
  if (chat.isGroup) return 'Групповой чат'
  if (chat.name && chat.phone) return formatPhone(chat.phone)
  return null
}
