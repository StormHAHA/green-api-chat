import { memo } from 'react'
import { getChatTitle } from '../../domain/chat'
import type { Chat } from '../../domain/types'
import { getLastActivity } from '../../state/chatReducer'
import { formatChatTime } from '../../utils/date'
import { Avatar } from '../Avatar/Avatar'
import { AlertIcon } from '../Icons'
import styles from './ChatListItem.module.css'

interface ChatListItemProps {
  chat: Chat
  isActive: boolean
  onSelect: (id: string) => void
}

export const ChatListItem = memo(function ChatListItem({
  chat,
  isActive,
  onSelect,
}: ChatListItemProps) {
  const title = getChatTitle(chat)
  const lastMessage = chat.messages.at(-1)

  return (
    <button
      type="button"
      className={styles.item}
      data-active={isActive}
      aria-current={isActive || undefined}
      onClick={() => onSelect(chat.id)}
    >
      <Avatar title={title} seed={chat.chatId} />
      <span className={styles.body}>
        <span className={styles.row}>
          <span className={styles.title}>{title}</span>
          <span className={styles.time}>{formatChatTime(getLastActivity(chat))}</span>
        </span>
        <span className={styles.row}>
          <span className={styles.preview}>
            {lastMessage ? (
              <>
                {lastMessage.direction === 'outgoing' && (
                  <span className={styles.previewAuthor}>Вы: </span>
                )}
                {lastMessage.text}
              </>
            ) : (
              'Нет сообщений'
            )}
          </span>
          {lastMessage?.status === 'failed' ? (
            <AlertIcon
              className={styles.failed}
              width={18}
              height={18}
              aria-label="Не отправлено"
            />
          ) : (
            chat.unreadCount > 0 && (
              <span className={styles.badge} aria-label={`Непрочитанных: ${chat.unreadCount}`}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </span>
            )
          )}
        </span>
      </span>
    </button>
  )
})
