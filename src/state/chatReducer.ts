import type { Chat, ChatMessageEvent, ChatState, Message } from '../domain/types'

/**
 * localChatId - локальный идентификатор чата (Chat.id),
 * chatId - идентификатор чата в GREEN-API (Chat.chatId).
 */
export type ChatAction =
  | {
      type: 'chatOpened'
      localChatId: string
      chatId: string
      phone?: string
      createdAt: number
    }
  | { type: 'chatSelected'; localChatId: string | null }
  | { type: 'messageQueued'; localChatId: string; message: Message }
  | {
      type: 'messageSent'
      localChatId: string
      localMessageId: string
      idMessage: string
    }
  | { type: 'messageFailed'; localChatId: string; localMessageId: string }
  | { type: 'messageRetried'; localChatId: string; localMessageId: string }
  | { type: 'messageReceived'; event: ChatMessageEvent; newLocalChatId: string }

export const initialChatState: ChatState = { chats: [], activeLocalChatId: null }

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'chatOpened':
      return openChat(state, action)

    case 'chatSelected':
      return {
        chats:
          action.localChatId === null
            ? state.chats
            : updateChat(state.chats, action.localChatId, (chat) =>
                chat.unreadCount === 0 ? chat : { ...chat, unreadCount: 0 },
              ),
        activeLocalChatId: action.localChatId,
      }

    case 'messageQueued':
      return {
        ...state,
        chats: updateChat(state.chats, action.localChatId, (chat) => ({
          ...chat,
          messages: insertMessage(chat.messages, action.message),
        })),
      }

    case 'messageSent':
      return {
        ...state,
        chats: updateChat(state.chats, action.localChatId, (chat) => {
          // Уведомление об отправке через API могло прийти раньше ответа sendMessage
          if (chat.messages.some((message) => message.id === action.idMessage)) {
            return {
              ...chat,
              messages: chat.messages.filter((message) => message.id !== action.localMessageId),
            }
          }
          return {
            ...chat,
            messages: updateMessage(chat.messages, action.localMessageId, (message) => ({
              ...message,
              id: action.idMessage,
              status: 'sent',
            })),
          }
        }),
      }

    case 'messageFailed':
      return setMessageStatus(state, action.localChatId, action.localMessageId, 'failed')

    case 'messageRetried':
      return setMessageStatus(state, action.localChatId, action.localMessageId, 'sending')

    case 'messageReceived':
      return receiveMessage(state, action.event, action.newLocalChatId)
  }
}

function openChat(
  state: ChatState,
  action: Extract<ChatAction, { type: 'chatOpened' }>,
): ChatState {
  const existing = state.chats.find(
    (chat) =>
      chat.chatId === action.chatId || (action.phone !== undefined && chat.phone === action.phone),
  )

  if (existing) {
    const chats = updateChat(state.chats, existing.id, (chat) => ({
      ...chat,
      chatId: action.chatId,
      unreadCount: 0,
    }))
    return { chats, activeLocalChatId: existing.id }
  }

  const chat: Chat = {
    id: action.localChatId,
    chatId: action.chatId,
    phone: action.phone,
    isGroup: false,
    messages: [],
    unreadCount: 0,
    createdAt: action.createdAt,
  }
  return { chats: [chat, ...state.chats], activeLocalChatId: chat.id }
}

function receiveMessage(
  state: ChatState,
  event: ChatMessageEvent,
  newLocalChatId: string,
): ChatState {
  const target = findChatForEvent(state.chats, event)

  if (!target) {
    const chat: Chat = {
      id: newLocalChatId,
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

    const isUnread = event.direction === 'incoming' && state.activeLocalChatId !== chat.id

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

function findChatForEvent(chats: Chat[], event: ChatMessageEvent): Chat | undefined {
  const byChatId = chats.find((chat) => chat.chatId === event.chatId)
  if (byChatId || event.isGroup || !event.senderPhone) return byChatId
  return chats.find((chat) => chat.phone === event.senderPhone)
}

function toMessage(event: ChatMessageEvent): Message {
  return {
    id: event.idMessage,
    text: event.text,
    direction: event.direction,
    timestamp: event.timestamp,
    status: event.direction === 'outgoing' ? 'sent' : undefined,
    senderName: event.isGroup && event.direction === 'incoming' ? event.senderName : undefined,
  }
}

function updateChat(chats: Chat[], localChatId: string, update: (chat: Chat) => Chat): Chat[] {
  return chats.map((chat) => (chat.id === localChatId ? update(chat) : chat))
}

function updateMessage(
  messages: Message[],
  messageId: string,
  update: (message: Message) => Message,
): Message[] {
  return messages.map((message) => (message.id === messageId ? update(message) : message))
}

function setMessageStatus(
  state: ChatState,
  localChatId: string,
  localMessageId: string,
  status: Message['status'],
): ChatState {
  return {
    ...state,
    chats: updateChat(state.chats, localChatId, (chat) => ({
      ...chat,
      messages: updateMessage(chat.messages, localMessageId, (message) => ({ ...message, status })),
    })),
  }
}

function insertMessage(messages: Message[], message: Message): Message[] {
  const index = messages.findLastIndex((existing) => existing.timestamp <= message.timestamp)
  return [...messages.slice(0, index + 1), message, ...messages.slice(index + 1)]
}
