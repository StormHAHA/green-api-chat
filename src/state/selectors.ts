import type { Chat } from '../domain/types'

export function getLastActivity(chat: Chat): number {
  return chat.messages.at(-1)?.timestamp ?? chat.createdAt
}

export function sortChatsByActivity(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => getLastActivity(b) - getLastActivity(a))
}
