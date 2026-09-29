import { ChatBubbleIcon } from '../Icons'
import styles from './EmptyChat.module.css'

export function EmptyChat() {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <ChatBubbleIcon width={32} height={32} />
      </span>
      <p className={styles.text}>Выберите чат или создайте новый</p>
    </div>
  )
}
