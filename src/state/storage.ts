import type { Credentials } from '../api/types'
import type { ChatState } from '../domain/types'
import { initialChatState } from './chatReducer'

const CREDENTIALS_KEY = 'green-api-chat:credentials'
const chatsKey = (idInstance: string) => `green-api-chat:chats:${idInstance}`

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Хранилище недоступно (приватный режим, переполнение) — работаем без сохранения
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // См. комментарий в write
  }
}

export function loadCredentials(): Credentials | null {
  const credentials = read<Credentials>(CREDENTIALS_KEY)
  if (!credentials?.apiUrl || !credentials.idInstance || !credentials.apiTokenInstance) return null
  return credentials
}

export function saveCredentials(credentials: Credentials): void {
  write(CREDENTIALS_KEY, credentials)
}

export function clearCredentials(): void {
  remove(CREDENTIALS_KEY)
}

export function loadChatState(idInstance: string): ChatState {
  const state = read<ChatState>(chatsKey(idInstance))
  if (!state || !Array.isArray(state.chats)) return initialChatState

  // Сообщения, которые не успели уйти до перезагрузки страницы, считаем неотправленными
  return {
    activeChatId: null,
    chats: state.chats.map((chat) => ({
      ...chat,
      messages: chat.messages.map((message) =>
        message.status === 'sending' ? { ...message, status: 'failed' } : message,
      ),
    })),
  }
}

export function saveChatState(idInstance: string, state: ChatState): void {
  write(chatsKey(idInstance), state)
}
