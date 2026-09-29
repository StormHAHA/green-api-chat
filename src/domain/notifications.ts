import type { MessageData, MessageWebhook, NotificationBody, SenderData } from '../api/types'
import type { MessageDirection, MessageEvent } from './types'

const DIRECTION_BY_WEBHOOK: Record<MessageWebhook['typeWebhook'], MessageDirection> = {
  incomingMessageReceived: 'incoming',
  outgoingMessageReceived: 'outgoing',
  outgoingAPIMessageReceived: 'outgoing',
}

const GROUP_CHAT_TYPES = new Set(['group', 'supergroup', 'channel'])

function isMessageWebhook(body: NotificationBody): body is MessageWebhook {
  return body.typeWebhook in DIRECTION_BY_WEBHOOK
}

function extractText(messageData: MessageData): string | null {
  switch (messageData.typeMessage) {
    case 'textMessage':
      return messageData.textMessageData?.textMessage ?? null
    case 'extendedTextMessage':
      return messageData.extendedTextMessageData?.text ?? null
    default:
      return null
  }
}

function isGroupChat(senderData: SenderData): boolean {
  if (senderData.chatType) return GROUP_CHAT_TYPES.has(senderData.chatType)
  return senderData.chatId.startsWith('-') || senderData.chatId.endsWith('@g.us')
}

/**
 * Преобразует уведомление GREEN-API в событие чата.
 * Возвращает null для всего, что не является текстовым сообщением:
 * статусов, медиа, событий инстанса и т. п.
 */
export function parseNotification(body: NotificationBody): MessageEvent | null {
  if (!isMessageWebhook(body)) return null

  const text = extractText(body.messageData)
  if (text === null) return null

  const { senderData } = body
  const direction = DIRECTION_BY_WEBHOOK[body.typeWebhook]
  const isGroup = isGroupChat(senderData)
  const senderPhone =
    direction === 'incoming' && senderData.senderPhoneNumber
      ? String(senderData.senderPhoneNumber)
      : undefined

  return {
    direction,
    idMessage: body.idMessage,
    chatId: senderData.chatId,
    chatName: senderData.chatName || undefined,
    isGroup,
    senderName: senderData.senderContactName || senderData.senderName || undefined,
    senderPhone,
    text,
    timestamp: body.timestamp * 1000,
  }
}
