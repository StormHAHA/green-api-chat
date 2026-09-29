import { describe, expect, it } from 'vitest'
import type { ChatState, Message, ChatMessageEvent } from '../domain/types'
import { chatReducer, initialChatState } from './chatReducer'
import { sortChatsByActivity } from './selectors'

function openChat(state: ChatState = initialChatState) {
  return chatReducer(state, {
    type: 'chatOpened',
    localChatId: 'chat-1',
    chatId: '10000000',
    phone: '79998887766',
    createdAt: 1_000,
  })
}

function incoming(overrides: Partial<ChatMessageEvent> = {}): ChatMessageEvent {
  return {
    direction: 'incoming',
    idMessage: 'in-1',
    chatId: '10000000',
    chatName: 'Василиса',
    isGroup: false,
    senderName: 'Василиса',
    senderPhone: '79998887766',
    text: 'Привет!',
    timestamp: 2_000,
    ...overrides,
  }
}

const pending: Message = {
  id: 'local-1',
  text: 'Как дела?',
  direction: 'outgoing',
  timestamp: 3_000,
  status: 'sending',
}

describe('chatReducer', () => {
  it('создаёт чат и делает его активным', () => {
    const state = openChat()
    expect(state.activeLocalChatId).toBe('chat-1')
    expect(state.chats).toHaveLength(1)
  })

  it('не дублирует чат при повторном вводе того же номера', () => {
    const state = chatReducer(openChat(), {
      type: 'chatOpened',
      localChatId: 'chat-2',
      chatId: '79998887766@c.us',
      phone: '79998887766',
      createdAt: 5_000,
    })
    expect(state.chats).toHaveLength(1)
    expect(state.activeLocalChatId).toBe('chat-1')
  })

  it('доставляет ответ в чат и подставляет имя собеседника', () => {
    const state = chatReducer(openChat(), {
      type: 'messageReceived',
      event: incoming(),
      newLocalChatId: 'unused',
    })
    const [chat] = state.chats
    expect(chat?.name).toBe('Василиса')
    expect(chat?.messages.map((message) => message.text)).toEqual(['Привет!'])
    expect(chat?.unreadCount).toBe(0)
  })

  it('находит чат по номеру телефона, если он создан по номеру', () => {
    const opened = chatReducer(initialChatState, {
      type: 'chatOpened',
      localChatId: 'chat-1',
      chatId: '79998887766@c.us',
      phone: '79998887766',
      createdAt: 1_000,
    })
    const state = chatReducer(opened, {
      type: 'messageReceived',
      event: incoming(),
      newLocalChatId: 'unused',
    })
    expect(state.chats).toHaveLength(1)
    expect(state.chats[0]?.chatId).toBe('10000000')
  })

  it('создаёт чат для сообщения от нового собеседника и считает его непрочитанным', () => {
    const state = chatReducer(initialChatState, {
      type: 'messageReceived',
      event: incoming(),
      newLocalChatId: 'chat-new',
    })
    expect(state.chats[0]).toMatchObject({ id: 'chat-new', unreadCount: 1, name: 'Василиса' })
  })

  it('игнорирует повторную доставку одного и того же уведомления', () => {
    const once = chatReducer(openChat(), {
      type: 'messageReceived',
      event: incoming(),
      newLocalChatId: 'unused',
    })
    const twice = chatReducer(once, {
      type: 'messageReceived',
      event: incoming(),
      newLocalChatId: 'x',
    })
    expect(twice).toBe(once)
  })

  it('проходит путь отправки сообщения: очередь → отправлено', () => {
    const queued = chatReducer(openChat(), {
      type: 'messageQueued',
      localChatId: 'chat-1',
      message: pending,
    })
    const sent = chatReducer(queued, {
      type: 'messageSent',
      localChatId: 'chat-1',
      localMessageId: 'local-1',
      idMessage: 'out-1',
    })
    expect(sent.chats[0]?.messages).toEqual([{ ...pending, id: 'out-1', status: 'sent' }])
  })

  it('помечает сообщение как неотправленное и позволяет повторить', () => {
    const queued = chatReducer(openChat(), {
      type: 'messageQueued',
      localChatId: 'chat-1',
      message: pending,
    })
    const failed = chatReducer(queued, {
      type: 'messageFailed',
      localChatId: 'chat-1',
      localMessageId: 'local-1',
    })
    expect(failed.chats[0]?.messages[0]?.status).toBe('failed')

    const retried = chatReducer(failed, {
      type: 'messageRetried',
      localChatId: 'chat-1',
      localMessageId: 'local-1',
    })
    expect(retried.chats[0]?.messages[0]?.status).toBe('sending')
  })

  it('не дублирует сообщение, если уведомление об отправке пришло раньше ответа API', () => {
    const queued = chatReducer(openChat(), {
      type: 'messageQueued',
      localChatId: 'chat-1',
      message: pending,
    })
    const notified = chatReducer(queued, {
      type: 'messageReceived',
      event: incoming({
        direction: 'outgoing',
        idMessage: 'out-1',
        text: pending.text,
        timestamp: 3_100,
      }),
      newLocalChatId: 'unused',
    })
    const sent = chatReducer(notified, {
      type: 'messageSent',
      localChatId: 'chat-1',
      localMessageId: 'local-1',
      idMessage: 'out-1',
    })
    expect(sent.chats[0]?.messages).toEqual([{ ...pending, id: 'out-1', status: 'sent' }])
  })

  it('сбрасывает счётчик непрочитанных при открытии чата', () => {
    const unread = chatReducer(initialChatState, {
      type: 'messageReceived',
      event: incoming(),
      newLocalChatId: 'chat-new',
    })
    const selected = chatReducer(unread, { type: 'chatSelected', localChatId: 'chat-new' })
    expect(selected.chats[0]?.unreadCount).toBe(0)
  })

  it('сортирует сообщения по времени', () => {
    let state = openChat()
    state = chatReducer(state, {
      type: 'messageReceived',
      event: incoming({ idMessage: 'b', text: 'второе', timestamp: 3_000 }),
      newLocalChatId: 'unused',
    })
    state = chatReducer(state, {
      type: 'messageReceived',
      event: incoming({ idMessage: 'a', text: 'первое', timestamp: 2_000 }),
      newLocalChatId: 'unused',
    })
    expect(state.chats[0]?.messages.map((message) => message.text)).toEqual(['первое', 'второе'])
  })
})

describe('sortChatsByActivity', () => {
  it('поднимает наверх чаты с последними сообщениями', () => {
    let state = openChat()
    state = chatReducer(state, {
      type: 'messageReceived',
      event: incoming({ chatId: '20000000', senderPhone: '79990000000', timestamp: 9_000 }),
      newLocalChatId: 'chat-2',
    })
    state = chatReducer(state, { type: 'chatSelected', localChatId: 'chat-1' })
    expect(sortChatsByActivity(state.chats).map((chat) => chat.id)).toEqual(['chat-2', 'chat-1'])
  })
})
