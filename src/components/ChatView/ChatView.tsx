import { getChatSubtitle, getChatTitle } from '../../domain/chat'
import type { Chat, Message } from '../../domain/types'
import { Avatar } from '../Avatar/Avatar'
import { BackIcon } from '../Icons'
import styles from './ChatView.module.css'
import { Composer } from './Composer'
import { MessageList } from './MessageList'

interface ChatViewProps {
  chat: Chat
  onBack: () => void
  onSend: (text: string) => void
  onRetry: (message: Message) => void
}

export function ChatView({ chat, onBack, onSend, onRetry }: ChatViewProps) {
  const title = getChatTitle(chat)
  const subtitle = getChatSubtitle(chat)

  return (
    <section className={styles.chat} aria-label={`Чат: ${title}`}>
      <header className={styles.header}>
        <button type="button" className={styles.back} onClick={onBack} aria-label="Назад к чатам">
          <BackIcon />
        </button>
        <Avatar title={title} seed={chat.chatId} size={40} />
        <div className={styles.heading}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </header>

      <MessageList messages={chat.messages} onRetry={onRetry} />

      <Composer onSend={onSend} />
    </section>
  )
}
