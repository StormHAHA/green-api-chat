import { useMemo } from 'react'
import { createGreenApiClient } from '../../api/greenApi'
import type { Credentials } from '../../api/types'
import { useChats } from '../../hooks/useChats'
import { useNotificationPolling } from '../../hooks/useNotificationPolling'
import { ChatView } from '../ChatView/ChatView'
import { EmptyChat } from '../ChatView/EmptyChat'
import { Sidebar } from '../Sidebar/Sidebar'
import styles from './Messenger.module.css'

interface MessengerProps {
  credentials: Credentials
  onLogout: () => void
}

export function Messenger({ credentials, onLogout }: MessengerProps) {
  const client = useMemo(() => createGreenApiClient(credentials), [credentials])
  const { state, openChat, selectChat, sendMessage, retryMessage, handleNotification } = useChats(
    client,
    credentials.idInstance,
  )
  const connection = useNotificationPolling(client, handleNotification)

  const activeChat = state.chats.find((chat) => chat.id === state.activeLocalChatId) ?? null

  return (
    <div className={styles.layout} data-chat-open={activeChat !== null}>
      <Sidebar
        className={styles.sidebar}
        chats={state.chats}
        activeLocalChatId={state.activeLocalChatId}
        connection={connection}
        idInstance={credentials.idInstance}
        onSelectChat={selectChat}
        onCreateChat={openChat}
        onLogout={onLogout}
      />
      <main className={styles.main}>
        {activeChat ? (
          <ChatView
            key={activeChat.id}
            chat={activeChat}
            onBack={() => selectChat(null)}
            onSend={(text) => sendMessage(activeChat, text)}
            onRetry={(message) => retryMessage(activeChat, message)}
          />
        ) : (
          <EmptyChat />
        )}
      </main>
    </div>
  )
}
