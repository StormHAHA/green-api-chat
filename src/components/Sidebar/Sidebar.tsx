import { useMemo, useState } from 'react'
import type { Chat } from '../../domain/types'
import type { ConnectionStatus } from '../../hooks/useNotificationPolling'
import { sortChatsByActivity } from '../../state/selectors'
import { ComposeIcon, LogoutIcon } from '../Icons'
import { NewChatDialog } from '../NewChatDialog/NewChatDialog'
import { Button } from '../ui/Button'
import { ChatListItem } from './ChatListItem'
import styles from './Sidebar.module.css'

const CONNECTION_LABELS: Record<ConnectionStatus['state'], string> = {
  connecting: 'Подключение…',
  online: 'В сети',
  error: 'Нет соединения',
}

interface SidebarProps {
  className?: string
  chats: Chat[]
  activeLocalChatId: string | null
  connection: ConnectionStatus
  idInstance: string
  onSelectChat: (id: string) => void
  onCreateChat: (phone: string) => Promise<void>
  onLogout: () => void
}

export function Sidebar({
  className,
  chats,
  activeLocalChatId,
  connection,
  idInstance,
  onSelectChat,
  onCreateChat,
  onLogout,
}: SidebarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const sortedChats = useMemo(() => sortChatsByActivity(chats), [chats])

  return (
    <aside className={[styles.sidebar, className].filter(Boolean).join(' ')}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Чаты</h1>
          <p
            className={styles.status}
            data-state={connection.state}
            title={connection.state === 'error' ? connection.message : undefined}
          >
            <span className={styles.statusDot} aria-hidden="true" />
            {CONNECTION_LABELS[connection.state]} · {idInstance}
          </p>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setIsDialogOpen(true)}
          aria-label="Новый чат"
          title="Новый чат"
        >
          <ComposeIcon width={22} height={22} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onLogout}
          aria-label="Выйти"
          title="Выйти"
        >
          <LogoutIcon width={22} height={22} />
        </button>
      </header>

      {connection.state === 'error' && <p className={styles.banner}>{connection.message}</p>}

      {sortedChats.length > 0 ? (
        <nav className={styles.list} aria-label="Список чатов">
          {sortedChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeLocalChatId}
              onSelect={onSelectChat}
            />
          ))}
        </nav>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Пока нет чатов</p>
          <p className={styles.emptyText}>Начните переписку по номеру телефона</p>
          <Button onClick={() => setIsDialogOpen(true)}>Новый чат</Button>
        </div>
      )}

      <NewChatDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={onCreateChat}
      />
    </aside>
  )
}
