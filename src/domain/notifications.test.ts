import { describe, expect, it } from 'vitest'
import type { MessageWebhook, NotificationBody } from '../api/types'
import { parseNotification } from './notifications'

function textWebhook(overrides: Partial<MessageWebhook> = {}): MessageWebhook {
  return {
    typeWebhook: 'incomingMessageReceived',
    timestamp: 1763115112,
    idMessage: '1763115112345',
    senderData: {
      chatId: '10000000',
      chatType: 'user',
      sender: '10000000',
      chatName: 'Василиса',
      senderName: 'Василиса Премудрая',
      senderContactName: '',
      senderPhoneNumber: 79998887766,
    },
    messageData: {
      typeMessage: 'textMessage',
      textMessageData: { textMessage: 'Привет!' },
    },
    ...overrides,
  }
}

describe('parseNotification', () => {
  it('разбирает входящее текстовое сообщение', () => {
    expect(parseNotification(textWebhook())).toEqual({
      direction: 'incoming',
      idMessage: '1763115112345',
      chatId: '10000000',
      chatName: 'Василиса',
      isGroup: false,
      senderName: 'Василиса Премудрая',
      senderPhone: '79998887766',
      text: 'Привет!',
      timestamp: 1763115112000,
    })
  })

  it('разбирает сообщение со ссылкой', () => {
    const event = parseNotification(
      textWebhook({
        messageData: {
          typeMessage: 'extendedTextMessage',
          extendedTextMessageData: { text: 'Смотри https://green-api.com' },
        },
      }),
    )
    expect(event?.text).toBe('Смотри https://green-api.com')
  })

  it('считает сообщения, отправленные с телефона, исходящими и не берёт из них номер', () => {
    const event = parseNotification(textWebhook({ typeWebhook: 'outgoingMessageReceived' }))
    expect(event?.direction).toBe('outgoing')
    expect(event?.senderPhone).toBeUndefined()
  })

  it('определяет групповые чаты', () => {
    const event = parseNotification(
      textWebhook({
        senderData: {
          chatId: '-10000000000000',
          chatType: 'supergroup',
          chatName: 'Тридесятое царство',
          senderName: 'Василиса',
          senderPhoneNumber: 0,
        },
      }),
    )
    expect(event).toMatchObject({ isGroup: true, senderPhone: undefined })
  })

  it('игнорирует нетекстовые сообщения', () => {
    expect(
      parseNotification(textWebhook({ messageData: { typeMessage: 'imageMessage' } })),
    ).toBeNull()
  })

  it('игнорирует служебные уведомления', () => {
    const body: NotificationBody = { typeWebhook: 'outgoingMessageStatus', timestamp: 1 }
    expect(parseNotification(body)).toBeNull()
  })
})
