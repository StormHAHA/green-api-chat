import type { Message } from '../../domain/types'
import { formatTime } from '../../utils/date'
import { AlertIcon, CheckIcon, ClockIcon } from '../Icons'
import styles from './MessageBubble.module.css'

interface MessageBubbleProps {
  message: Message
  isLastInGroup: boolean
  onRetry: (message: Message) => void
}

export function MessageBubble({ message, isLastInGroup, onRetry }: MessageBubbleProps) {
  const isFailed = message.status === 'failed'

  return (
    <div className={styles.row} data-direction={message.direction} data-last={isLastInGroup}>
      <div className={styles.bubble}>
        {message.senderName && <p className={styles.sender}>{message.senderName}</p>}
        <p className={styles.text}>
          {message.text}
          <span className={styles.meta}>
            <time dateTime={new Date(message.timestamp).toISOString()}>
              {formatTime(message.timestamp)}
            </time>
            {message.status === 'sending' && (
              <ClockIcon width={14} height={14} aria-label="Отправляется" />
            )}
            {message.status === 'sent' && (
              <CheckIcon width={15} height={15} aria-label="Отправлено" />
            )}
            {isFailed && (
              <AlertIcon className={styles.failedIcon} width={15} height={15} aria-hidden="true" />
            )}
          </span>
        </p>
      </div>
      {isFailed && (
        <button type="button" className={styles.retry} onClick={() => onRetry(message)}>
          Не отправлено. Повторить
        </button>
      )}
    </div>
  )
}
