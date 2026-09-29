import { useEffect, useRef, useState } from 'react'
import type { GreenApiClient } from '../api/greenApi'
import type { NotificationBody } from '../api/types'

export type ConnectionStatus =
  { state: 'connecting' } | { state: 'online' } | { state: 'error'; message: string }

const RECEIVE_TIMEOUT_SECONDS = 20
const MIN_RETRY_DELAY_MS = 2_000
const MAX_RETRY_DELAY_MS = 30_000

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

/**
 * Получение входящих уведомлений по технологии HTTP API:
 * ReceiveNotification → обработка → DeleteNotification, в бесконечном цикле.
 */
export function useNotificationPolling(
  client: GreenApiClient,
  onNotification: (body: NotificationBody) => void,
): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>({ state: 'connecting' })
  const handlerRef = useRef(onNotification)

  useEffect(() => {
    handlerRef.current = onNotification
  }, [onNotification])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function poll() {
      let retryDelay = MIN_RETRY_DELAY_MS

      while (!signal.aborted) {
        try {
          const notification = await client.receiveNotification(RECEIVE_TIMEOUT_SECONDS, signal)
          setStatus({ state: 'online' })
          retryDelay = MIN_RETRY_DELAY_MS

          if (!notification) continue

          try {
            handlerRef.current(notification.body)
          } finally {
            await client.deleteNotification(notification.receiptId, signal)
          }
        } catch (error) {
          if (signal.aborted) return
          setStatus({
            state: 'error',
            message: error instanceof Error ? error.message : 'Не удалось получить сообщения',
          })
          await wait(retryDelay, signal)
          retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS)
        }
      }
    }

    void poll()
    return () => controller.abort()
  }, [client])

  return status
}
