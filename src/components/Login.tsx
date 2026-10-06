import { type FormEvent, useState } from 'react'
import { type Credentials, getStateInstance } from '../api/greenApi'

interface Props {
  onLogin: (c: Credentials) => void
}

export function Login({ onLogin }: Props) {
  const [apiUrl, setApiUrl] = useState('https://api.green-api.com')
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const creds = {
      apiUrl: apiUrl.trim(),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }
    setLoading(true)
    setError(null)
    try {
      const { stateInstance } = await getStateInstance(creds)
      if (stateInstance !== 'authorized') {
        setError(`Инстанс не авторизован (состояние: ${stateInstance}). Привяжите аккаунт в личном кабинете GREEN-API.`)
        return
      }
      onLogin(creds)
    } catch {
      setError('Не удалось подключиться. Проверьте apiUrl, idInstance и apiTokenInstance.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__logo">MAX</div>
        <h1>Вход через GREEN-API</h1>
        <p className="login__hint">Данные инстанса есть в личном кабинете console.green-api.com</p>

        <label>
          apiUrl
          <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} required />
        </label>
        <label>
          idInstance
          <input
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="1101000001"
            required
            autoFocus
          />
        </label>
        <label>
          apiTokenInstance
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            required
          />
        </label>

        {error && <div className="login__error">{error}</div>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
