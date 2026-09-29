import { useCallback, useEffect, useReducer, useRef } from 'react'
import { GreenApiError, type GreenApiClient } from '../api/greenApi'
import type { NotificationBody } from '../api/types'
import { parseNotification } from '../domain/notifications'
import { phoneToChatId } from '../domain/phone'
import type { Chat, Message } from '../domain/types'
import { chatReducer } from '../state/chatReducer'
import { loadChatState, saveChatState } from '../state/storage'

const createId = () => crypto.randomUUID()

export function useChats(client: GreenApiClient, idInstance: string) {
  const [state, dispatch] = useReducer(chatReducer, idInstance, loadChatState)
  const chatsRef = useRef(state.chats)

  useEffect(() => {
    chatsRef.current = state.chats
    saveChatState(idInstance, state)
  }, [idInstance, state])

  const openChat = useCallback(
    async (phone: string) => {
      const chatId = await resolveChatId(client, phone)
      dispatch({
        type: 'chatOpened',
        localChatId: createId(),
        chatId,
        phone,
        createdAt: Date.now(),
      })
    },
    [client],
  )

  const selectChat = useCallback((localChatId: string | null) => {
    dispatch({ type: 'chatSelected', localChatId })
  }, [])

  const deliver = useCallback(
    async (localChatId: string, message: Message) => {
      // chatId мог уточниться, пока сообщение ждало отправки, поэтому берём актуальный
      const chat = chatsRef.current.find((item) => item.id === localChatId)
      if (!chat) return

      try {
        const { idMessage } = await client.sendMessage({
          chatId: chat.chatId,
          message: message.text,
        })
        dispatch({ type: 'messageSent', localChatId, localMessageId: message.id, idMessage })
      } catch {
        dispatch({ type: 'messageFailed', localChatId, localMessageId: message.id })
      }
    },
    [client],
  )

  const sendMessage = useCallback(
    (chat: Chat, text: string) => {
      const message: Message = {
        id: `local-${createId()}`,
        text,
        direction: 'outgoing',
        timestamp: Date.now(),
        status: 'sending',
      }
      dispatch({ type: 'messageQueued', localChatId: chat.id, message })
      void deliver(chat.id, message)
    },
    [deliver],
  )

  const retryMessage = useCallback(
    (chat: Chat, message: Message) => {
      dispatch({ type: 'messageRetried', localChatId: chat.id, localMessageId: message.id })
      void deliver(chat.id, message)
    },
    [deliver],
  )

  const handleNotification = useCallback((body: NotificationBody) => {
    const event = parseNotification(body)
    if (event) dispatch({ type: 'messageReceived', event, newLocalChatId: createId() })
  }, [])

  return { state, openChat, selectChat, sendMessage, retryMessage, handleNotification }
}

/**
 * Во входящих уведомлениях Telegram собеседник определяется по внутреннему chatId,
 * поэтому при создании чата сначала узнаём его через CheckAccount.
 * Если проверка временно недоступна (лимиты, сбой мессенджера), отправляем по номеру телефона.
 */
async function resolveChatId(client: GreenApiClient, phone: string): Promise<string> {
  let account
  try {
    account = await client.checkAccount(phone)
  } catch (error) {
    if (isCredentialsOrNetworkError(error)) throw error
    return phoneToChatId(phone)
  }

  if (account.exist === false) {
    throw new Error('Аккаунт Telegram с этим номером не найден или скрыт настройками приватности')
  }
  return account.exist && account.chatId ? account.chatId : phoneToChatId(phone)
}

function isCredentialsOrNetworkError(error: unknown): boolean {
  return !(error instanceof GreenApiError) || [0, 401, 403].includes(error.status)
}
