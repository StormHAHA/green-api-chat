import type {
  CheckAccountResponse,
  Credentials,
  DeleteNotificationResponse,
  ReceivedNotification,
  SendMessageRequest,
  SendMessageResponse,
  StateInstanceResponse,
} from './types'

export class GreenApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  pathSuffix?: string
  query?: Record<string, string | number>
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 15_000
/** Запас сверх receiveTimeout, чтобы long polling не обрывался раньше ответа сервера */
const LONG_POLL_EXTRA_MS = 10_000

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Неверный idInstance или apiTokenInstance',
  403: 'Доступ к инстансу запрещён',
  429: 'Слишком много запросов, попробуйте позже',
  466: 'Исчерпан лимит запросов по тарифу',
}

export function normalizeApiUrl(apiUrl: string): string {
  return apiUrl.trim().replace(/\/+$/, '')
}

export function createGreenApiClient(credentials: Credentials) {
  const baseUrl = `${normalizeApiUrl(credentials.apiUrl)}/waInstance${credentials.idInstance}`

  async function request<T>(apiMethod: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      pathSuffix = '',
      query,
      body,
      signal,
      timeoutMs = DEFAULT_TIMEOUT_MS,
    } = options

    let url = `${baseUrl}/${apiMethod}/${credentials.apiTokenInstance}${pathSuffix}`
    if (query) {
      const params = new URLSearchParams(
        Object.entries(query).map(([key, value]) => [key, String(value)]),
      )
      url += `?${params}`
    }

    const timeoutSignal = AbortSignal.timeout(timeoutMs)
    let response: Response
    let text: string
    try {
      response = await fetch(url, {
        method,
        signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      text = await response.text()
    } catch (error) {
      if (signal?.aborted) throw error
      throw new GreenApiError(
        0,
        timeoutSignal.aborted
          ? 'Сервер GREEN-API не отвечает'
          : 'Нет соединения с сервером GREEN-API',
      )
    }

    if (!response.ok) {
      throw new GreenApiError(
        response.status,
        STATUS_MESSAGES[response.status] ?? extractErrorMessage(text, response.status),
      )
    }

    if (!text) return null as T
    try {
      return JSON.parse(text) as T
    } catch {
      throw new GreenApiError(response.status, 'Некорректный ответ сервера GREEN-API')
    }
  }

  return {
    getStateInstance(signal?: AbortSignal) {
      return request<StateInstanceResponse>('getStateInstance', { signal })
    },

    checkAccount(phoneNumber: string, signal?: AbortSignal) {
      return request<CheckAccountResponse>('checkAccount', {
        method: 'POST',
        body: { phoneNumber: Number(phoneNumber) },
        signal,
      })
    },

    sendMessage(payload: SendMessageRequest, signal?: AbortSignal) {
      return request<SendMessageResponse>('sendMessage', { method: 'POST', body: payload, signal })
    },

    receiveNotification(receiveTimeout: number, signal?: AbortSignal) {
      return request<ReceivedNotification | null>('receiveNotification', {
        query: { receiveTimeout },
        signal,
        timeoutMs: receiveTimeout * 1000 + LONG_POLL_EXTRA_MS,
      })
    },

    deleteNotification(receiptId: number, signal?: AbortSignal) {
      return request<DeleteNotificationResponse>('deleteNotification', {
        method: 'DELETE',
        pathSuffix: `/${receiptId}`,
        signal,
      })
    },
  }
}

export type GreenApiClient = ReturnType<typeof createGreenApiClient>

function extractErrorMessage(text: string, status: number): string {
  try {
    const data = JSON.parse(text) as { message?: unknown; reason?: unknown }
    const message = data.message ?? data.reason
    if (typeof message === 'string' && message) return message
  } catch {
    // Ответ не в формате JSON, используем текст как есть
  }
  const plain = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plain && plain.length <= 200 ? plain : `Ошибка сервера (${status})`
}
