import { describe, expect, it } from 'vitest'
import { guessApiUrl } from './instance'

describe('guessApiUrl', () => {
  it('определяет хост по первым цифрам idInstance', () => {
    expect(guessApiUrl('4100123456')).toBe('https://4100.api.green-api.com')
  })

  it('возвращает общий адрес, пока idInstance не введён', () => {
    expect(guessApiUrl('')).toBe('https://api.green-api.com')
  })
})
