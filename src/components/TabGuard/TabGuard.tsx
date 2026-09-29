import type { ReactNode } from 'react'
import { useExclusiveTab } from '../../hooks/useExclusiveTab'
import { ChatBubbleIcon } from '../Icons'
import { Button } from '../ui/Button'
import styles from './TabGuard.module.css'

interface TabGuardProps {
  channelName: string
  children: ReactNode
}

/**
 * Показывает содержимое только в активной вкладке. При повторной активации
 * содержимое монтируется заново и подхватывает историю, сохранённую другой вкладкой.
 */
export function TabGuard({ channelName, children }: TabGuardProps) {
  const { isActive, activate } = useExclusiveTab(channelName)

  if (isActive) return children

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <span className={styles.icon}>
          <ChatBubbleIcon width={28} height={28} />
        </span>
        <h1 className={styles.title}>Чат открыт в другой вкладке</h1>
        <p className={styles.text}>
          Получать сообщения можно только в одной вкладке. Нажмите кнопку ниже, чтобы продолжить
          здесь.
        </p>
        <Button onClick={activate}>Использовать здесь</Button>
      </div>
    </main>
  )
}
