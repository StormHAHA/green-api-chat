const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const dayMonthFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const fullDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const shortDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
})
const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' })

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function daysAgo(timestamp: number, now: number): number {
  return Math.round((startOfDay(now) - startOfDay(timestamp)) / DAY_MS)
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b)
}

export function formatTime(timestamp: number): string {
  return timeFormatter.format(timestamp)
}

/** Подпись-разделитель в ленте сообщений: «Сегодня», «Вчера», «12 сентября». */
export function formatDayLabel(timestamp: number, now = Date.now()): string {
  const diff = daysAgo(timestamp, now)
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return 'Вчера'
  const sameYear = new Date(timestamp).getFullYear() === new Date(now).getFullYear()
  return (sameYear ? dayMonthFormatter : fullDateFormatter).format(timestamp)
}

/** Время последнего сообщения в списке чатов, как в мессенджерах. */
export function formatChatTime(timestamp: number, now = Date.now()): string {
  const diff = daysAgo(timestamp, now)
  if (diff === 0) return formatTime(timestamp)
  if (diff < 7) return weekdayFormatter.format(timestamp)
  return shortDateFormatter.format(timestamp)
}
