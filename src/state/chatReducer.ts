import type { Chat, ChatState, Message, MessageEvent } from '../domain/types'

export type ChatAction =
  | {
      type: 'chatOpened'
      id: string
      chatId: string
      phone?: string
      name?: string
      createdAt: number
    }
  | { type: 'chatSelected'; id: string | null }
  | { type: 'messageQueued'; chatId: string; message: Message }
  | { type: 'messageSent'; chatId: string; localId: string; idMessage: string }
  | { type: 'messageFailed'; chatId: string; localId: string }
  | { type: 'messageRetried'; chatId: string; localId: string }
  | { type: 'messageReceived'; event: MessageEvent; newChatId: string }

export const initialChatState: ChatState = { chats: [], activeChatId: null }

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'chatOpened': {
      const existing = state.chats.find(
        (chat) =>
          chat.chatId === action.chatId ||
          (action.phone !== undefined && chat.phone === action.phone),
      )
      if (existing) {
        const chats = updateChat(state.chats, existing.id, (chat) => ({
          ...chat,
          chatId: action.chatId,
          unreadCount: 0,
        }))
        return { chats, activeChatId: existing.id }
      }

      const chat: Chat = {
        id: action.id,
        chatId: action.chatId,
        phone: action.phone,
        name: action.name,
        isGroup: false,
        messages: [],
        unreadCount: 0,
        createdAt: action.createdAt,
      }
      return { chats: [chat, ...state.chats], activeChatId: chat.id }
    }

    case 'chatSelected':
      return {
        chats:
          action.id === null
            ? state.chats
            : updateChat(state.chats, action.id, (chat) =>
                chat.unreadCount === 0 ? chat : { ...chat, unreadCount: 0 },
              ),
        activeChatId: action.id,
      }

    case 'messageQueued':
      return {
        ...state,
        chats: updateChat(state.chats, action.chatId, (chat) => ({
          ...chat,
          messages: insertMessage(chat.messages, action.message),
        })),
      }

    case 'messageSent':
      return {
        ...state,
        chats: updateChat(state.chats, action.chatId, (chat) => {
          // Уведомление об отправке через API могло прийти раньше ответа sendMessage
          if (chat.messages.some((message) => message.id === action.idMessage)) {
            return {
              ...chat,
              messages: chat.messages.filter((message) => message.id !== action.localId),
            }
          }
          return {
            ...chat,
            messages: updateMessage(chat.messages, action.localId, (message) => ({
              ...message,
              id: action.idMessage,
              status: 'sent',
            })),
          }
        }),
      }

    case 'messageFailed':
      return setMessageStatus(state, action.chatId, action.localId, 'failed')

    case 'messageRetried':
      return setMessageStatus(state, action.chatId, action.localId, 'sending')

    case 'messageReceived':
      return receiveMessage(state, action.event, action.newChatId)
  }
}

function receiveMessage(state: ChatState, event: MessageEvent, newChatId: string): ChatState {
  const target = findChatForEvent(state.chats, event)

  if (!target) {
    const chat: Chat = {
      id: newChatId,
      chatId: event.chatId,
      phone: event.isGroup ? undefined : event.senderPhone,
      name: event.chatName,
      isGroup: event.isGroup,
      messages: [toMessage(event)],
      unreadCount: event.direction === 'incoming' ? 1 : 0,
      createdAt: event.timestamp,
    }
    return { ...state, chats: [chat, ...state.chats] }
  }

  if (target.messages.some((message) => message.id === event.idMessage)) {
    return state
  }

  const chats = updateChat(state.chats, target.id, (chat) => {
    const pending =
      event.direction === 'outgoing'
        ? chat.messages.find(
            (message) => message.status === 'sending' && message.text === event.text,
          )
        : undefined

    const messages = pending
      ? updateMessage(chat.messages, pending.id, (message) => ({
          ...message,
          id: event.idMessage,
          status: 'sent',
        }))
      : insertMessage(chat.messages, toMessage(event))

    const isUnread = event.direction === 'incoming' && state.activeChatId !== chat.id

    return {
      ...chat,
      chatId: event.chatId,
      name: event.chatName ?? chat.name,
      phone: chat.phone ?? (event.isGroup ? undefined : event.senderPhone),
      messages,
      unreadCount: isUnread ? chat.unreadCount + 1 : chat.unreadCount,
    }
  })

  return { ...state, chats }
}

function findChatForEvent(chats: Chat[], event: MessageEvent): Chat | undefined {
  const byChatId = chats.find((chat) => chat.chatId === event.chatId)
  if (byChatId || event.isGroup || !event.senderPhone) return byChatId
  return chats.find((chat) => chat.phone === event.senderPhone)
}

function toMessage(event: MessageEvent): Message {
  return {
    id: event.idMessage,
    text: event.text,
    direction: event.direction,
    timestamp: event.timestamp,
    status: event.direction === 'outgoing' ? 'sent' : undefined,
    senderName: event.isGroup && event.direction === 'incoming' ? event.senderName : undefined,
  }
}

function updateChat(chats: Chat[], id: string, update: (chat: Chat) => Chat): Chat[] {
  return chats.map((chat) => (chat.id === id ? update(chat) : chat))
}

function updateMessage(
  messages: Message[],
  id: string,
  update: (message: Message) => Message,
): Message[] {
  return messages.map((message) => (message.id === id ? update(message) : message))
}

function setMessageStatus(
  state: ChatState,
  chatId: string,
  localId: string,
  status: Message['status'],
): ChatState {
  return {
    ...state,
    chats: updateChat(state.chats, chatId, (chat) => ({
      ...chat,
      messages: updateMessage(chat.messages, localId, (message) => ({ ...message, status })),
    })),
  }
}

function insertMessage(messages: Message[], message: Message): Message[] {
  const index = messages.findLastIndex((existing) => existing.timestamp <= message.timestamp)
  return [...messages.slice(0, index + 1), message, ...messages.slice(index + 1)]
}

export function getLastActivity(chat: Chat): number {
  return chat.messages.at(-1)?.timestamp ?? chat.createdAt
}

export function sortChatsByActivity(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => getLastActivity(b) - getLastActivity(a))
}
