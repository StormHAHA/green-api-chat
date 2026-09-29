import { useEffect, useRef, useState, type FormEvent } from 'react'
import { isValidPhone, normalizePhone } from '../../domain/phone'
import { CloseIcon } from '../Icons'
import { Button } from '../ui/Button'
import { ErrorMessage } from '../ui/ErrorMessage'
import { TextField } from '../ui/TextField'
import styles from './NewChatDialog.module.css'

interface NewChatDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (phone: string) => Promise<void>
}

export function NewChatDialog({ open, onClose, onSubmit }: NewChatDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  function handleClose() {
    setPhone('')
    setError(null)
    onClose()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const normalized = normalizePhone(phone)
    if (!isValidPhone(normalized)) {
      setError('Введите номер в международном формате, например +7 999 123-45-67')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit(normalized)
      handleClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось создать чат')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="new-chat-title"
      onClose={handleClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose()
      }}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <header className={styles.header}>
          <h2 id="new-chat-title" className={styles.title}>
            Новый чат
          </h2>
          <button type="button" className={styles.close} onClick={handleClose} aria-label="Закрыть">
            <CloseIcon width={20} height={20} />
          </button>
        </header>

        <TextField
          label="Номер телефона получателя"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 999 123-45-67"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoFocus
        />

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!phone.trim()}>
            Создать чат
          </Button>
        </div>
      </form>
    </dialog>
  )
}
