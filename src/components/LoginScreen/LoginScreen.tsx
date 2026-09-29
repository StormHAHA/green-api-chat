import { useState, type FormEvent } from 'react'
import { createGreenApiClient, normalizeApiUrl } from '../../api/greenApi'
import type { Credentials, InstanceState } from '../../api/types'
import { guessApiUrl } from '../../domain/instance'
import { ChatBubbleIcon } from '../Icons'
import { Button } from '../ui/Button'
import { ErrorMessage } from '../ui/ErrorMessage'
import { TextField } from '../ui/TextField'
import styles from './LoginScreen.module.css'

const STATE_ERRORS: Partial<Record<InstanceState, string>> = {
  notAuthorized: 'Инстанс не авторизован. Привяжите аккаунт в личном кабинете GREEN-API',
  pendingPassword: 'Завершите авторизацию инстанса: требуется пароль двухфакторной аутентификации',
  blocked: 'Аккаунт инстанса заблокирован',
  starting: 'Инстанс запускается. Повторите попытку через несколько минут',
}

interface LoginScreenProps {
  onLogin: (credentials: Credentials) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [isApiUrlEdited, setIsApiUrlEdited] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const effectiveApiUrl = isApiUrlEdited ? apiUrl : guessApiUrl(idInstance)
  const canSubmit = idInstance.trim() && apiTokenInstance.trim() && effectiveApiUrl.trim()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || isSubmitting) return

    const credentials: Credentials = {
      apiUrl: normalizeApiUrl(effectiveApiUrl),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }

    if (!/^\d+$/.test(credentials.idInstance)) {
      setError('idInstance должен состоять только из цифр')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const { stateInstance } = await createGreenApiClient(credentials).getStateInstance()
      const stateError = STATE_ERRORS[stateInstance]
      if (stateError) {
        setError(stateError)
        return
      }
      onLogin(credentials)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось подключиться к GREEN-API')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <div className={styles.header}>
          <span className={styles.logo}>
            <ChatBubbleIcon width={28} height={28} />
          </span>
          <h1 className={styles.title}>Вход в чат</h1>
          <p className={styles.subtitle}>
            Введите данные инстанса из личного кабинета{' '}
            <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
              GREEN-API
            </a>
          </p>
        </div>

        <div className={styles.fields}>
          <TextField
            label="idInstance"
            name="idInstance"
            inputMode="numeric"
            autoComplete="username"
            placeholder="1101000001"
            value={idInstance}
            onChange={(event) => setIdInstance(event.target.value)}
            autoFocus
            required
          />
          <TextField
            label="apiTokenInstance"
            name="apiTokenInstance"
            type="password"
            autoComplete="current-password"
            placeholder="Токен из личного кабинета"
            value={apiTokenInstance}
            onChange={(event) => setApiTokenInstance(event.target.value)}
            required
          />
          <TextField
            label="apiUrl"
            name="apiUrl"
            type="url"
            placeholder="https://api.green-api.com"
            hint="Подставляется автоматически по idInstance, при необходимости измените"
            value={effectiveApiUrl}
            onChange={(event) => {
              setIsApiUrlEdited(true)
              setApiUrl(event.target.value)
            }}
            required
          />
        </div>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" loading={isSubmitting} disabled={!canSubmit}>
          Войти
        </Button>
      </form>
    </main>
  )
}
