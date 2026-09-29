import { Fragment, useLayoutEffect, useRef } from 'react'
import type { Message } from '../../domain/types'
import { formatDayLabel, isSameDay } from '../../utils/date'
import { MessageBubble } from './MessageBubble'
import styles from './MessageList.module.css'

const STICK_TO_BOTTOM_THRESHOLD = 120

interface MessageListProps {
  messages: Message[]
  onRetry: (message: Message) => void
}

export function MessageList({ messages, onRetry }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const lastMessage = messages.at(-1)

  // Прокручиваем вниз при новом сообщении, если пользователь не листает историю
  // или если сообщение отправил он сам
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (isNearBottomRef.current || lastMessage?.direction === 'outgoing') {
      container.scrollTop = container.scrollHeight
    }
  }, [lastMessage?.id, lastMessage?.direction])

  function handleScroll() {
    const container = containerRef.current
    if (!container) return
    const distance = container.scrollHeight - container.scrollTop - container.clientHeight
    isNearBottomRef.current = distance < STICK_TO_BOTTOM_THRESHOLD
  }

  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Сообщений пока нет. Напишите первым!</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={styles.list}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Сообщения"
    >
      <div className={styles.inner}>
        {messages.map((message, index) => {
          const previous = messages[index - 1]
          const next = messages[index + 1]
          const startsDay = !previous || !isSameDay(previous.timestamp, message.timestamp)
          const endsGroup =
            !next ||
            next.direction !== message.direction ||
            !isSameDay(next.timestamp, message.timestamp)

          return (
            <Fragment key={message.id}>
              {startsDay && (
                <div className={styles.day}>
                  <span>{formatDayLabel(message.timestamp)}</span>
                </div>
              )}
              <MessageBubble message={message} isLastInGroup={endsGroup} onRetry={onRetry} />
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
