const DEFAULT_API_URL = 'https://api.green-api.com'

/**
 * Хост API зависит от инстанса: первые четыре цифры idInstance
 * определяют сервер, например 4100… → https://4100.api.green-api.com.
 */
export function guessApiUrl(idInstance: string): string {
  const digits = idInstance.trim()
  if (!/^\d{4,}$/.test(digits)) return DEFAULT_API_URL
  return `https://${digits.slice(0, 4)}.api.green-api.com`
}
