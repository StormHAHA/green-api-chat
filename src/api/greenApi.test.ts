import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGreenApiClient, GreenApiError } from './greenApi'

const client = createGreenApiClient({
  apiUrl: 'https://4100.api.green-api.com/',
  idInstance: '4100000000',
  apiTokenInstance: 'token',
})

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn((..._args: Parameters<typeof fetch>) =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createGreenApiClient', () => {
  it('отправляет сообщение по адресу метода', async () => {
    const fetchMock = mockFetch(new Response('{"idMessage":"123"}'))

    await expect(client.sendMessage({ chatId: '10000000', message: 'Привет' })).resolves.toEqual({
      idMessage: '123',
    })

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://4100.api.green-api.com/waInstance4100000000/sendMessage/token')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"chatId":"10000000","message":"Привет"}')
  })

  it('передаёт receiveTimeout и возвращает null, если уведомлений нет', async () => {
    const fetchMock = mockFetch(new Response('null'))

    await expect(client.receiveNotification(20)).resolves.toBeNull()
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://4100.api.green-api.com/waInstance4100000000/receiveNotification/token?receiveTimeout=20',
    )
  })

  it('переводит ошибку авторизации в понятное сообщение', async () => {
    mockFetch(new Response('', { status: 401 }))

    await expect(client.getStateInstance()).rejects.toEqual(
      new GreenApiError(401, 'Неверный idInstance или apiTokenInstance'),
    )
  })

  it('берёт текст ошибки из ответа сервера', async () => {
    mockFetch(new Response('{"message":"Validation failed"}', { status: 400 }))

    await expect(client.getStateInstance()).rejects.toThrow('Validation failed')
  })

  it('сообщает об отсутствии соединения', async () => {
    mockFetch(new TypeError('Failed to fetch'))

    await expect(client.getStateInstance()).rejects.toEqual(
      new GreenApiError(0, 'Нет соединения с сервером GREEN-API'),
    )
  })

  it('не падает на ответе не в формате JSON', async () => {
    mockFetch(new Response('<html>oops</html>'))

    await expect(client.getStateInstance()).rejects.toThrow('Некорректный ответ сервера GREEN-API')
  })
})
