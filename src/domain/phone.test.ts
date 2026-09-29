import { describe, expect, it } from 'vitest'
import { formatPhone, isValidPhone, normalizePhone, phoneToChatId } from './phone'

describe('normalizePhone', () => {
  it('убирает форматирование', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567')
  })

  it('переводит российские номера с 8 в формат с 7', () => {
    expect(normalizePhone('8 999 123 45 67')).toBe('79991234567')
  })

  it('не трогает иностранные номера', () => {
    expect(normalizePhone('+375 29 123 45 67')).toBe('375291234567')
  })
})

describe('isValidPhone', () => {
  it.each(['79991234567', '375291234567', '4915123456789'])('принимает %s', (phone) => {
    expect(isValidPhone(phone)).toBe(true)
  })

  it.each(['', '12345', '7999123456789012', '7999abc4567'])('отклоняет «%s»', (phone) => {
    expect(isValidPhone(phone)).toBe(false)
  })
})

describe('formatPhone', () => {
  it('форматирует российский номер', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67')
  })

  it('добавляет плюс к остальным номерам', () => {
    expect(formatPhone('375291234567')).toBe('+375291234567')
  })
})

describe('phoneToChatId', () => {
  it('строит chatId личного чата', () => {
    expect(phoneToChatId('79991234567')).toBe('79991234567@c.us')
  })
})
