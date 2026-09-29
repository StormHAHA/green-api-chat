const MIN_PHONE_LENGTH = 10
const MAX_PHONE_LENGTH = 15

/**
 * Приводит введённый номер к международному формату без символов: «79991234567».
 * Российские номера, начинающиеся с 8, переводятся в формат с кодом 7.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) {
    return `7${digits.slice(1)}`
  }
  return digits
}

export function isValidPhone(phone: string): boolean {
  return /^\d+$/.test(phone) && phone.length >= MIN_PHONE_LENGTH && phone.length <= MAX_PHONE_LENGTH
}

export function formatPhone(phone: string): string {
  const match = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(phone)
  if (match) {
    const [, code, first, second, third] = match
    return `+7 ${code} ${first}-${second}-${third}`
  }
  return `+${phone}`
}

export function phoneToChatId(phone: string): string {
  return `${phone}@c.us`
}
