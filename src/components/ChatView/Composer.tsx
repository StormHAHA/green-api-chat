import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { SendIcon } from '../Icons'
import styles from './Composer.module.css'

const MAX_MESSAGE_LENGTH = 4096
const COUNTER_THRESHOLD = MAX_MESSAGE_LENGTH - 200

interface ComposerProps {
  onSend: (text: string) => void
}

export function Composer({ onSend }: ComposerProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const trimmed = text.trim()
  const isTooLong = text.length > MAX_MESSAGE_LENGTH
  const canSend = trimmed.length > 0 && !isTooLong

  // Поле растёт по мере ввода текста, пока не упрётся в max-height из CSS
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [text])

  function submit() {
    if (!canSend) return
    onSend(trimmed)
    setText('')
    textareaRef.current?.focus()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <div className={styles.inner}>
        <div className={styles.field}>
          <label htmlFor="composer-input" className="visually-hidden">
            Сообщение
          </label>
          <textarea
            ref={textareaRef}
            id="composer-input"
            className={styles.input}
            rows={1}
            placeholder="Сообщение"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={isTooLong || undefined}
            autoFocus
          />
          {text.length > COUNTER_THRESHOLD && (
            <span className={styles.counter} data-invalid={isTooLong}>
              {text.length}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
        </div>
        <button type="submit" className={styles.send} disabled={!canSend} aria-label="Отправить">
          <SendIcon width={22} height={22} />
        </button>
      </div>
    </form>
  )
}
