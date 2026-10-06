import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import type { Chat } from '../types'
import { Avatar } from './Avatar'

interface Props {
  chat: Chat | null
  onSend: (chatId: string, text: string) => void
  onBack: () => void
}

const STATUS_ICON = { sending: '🕓', sent: '✓', error: '⚠' } as const

export function ChatWindow({ chat, onSend, onBack }: Props) {
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [chat?.messages.length, chat?.chatId])

  if (!chat) {
    return (
      <main className="chat chat--empty">
        <div className="chat__placeholder">Выберите чат или создайте новый по номеру телефона</div>
      </main>
    )
  }

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const value = text.trim()
    if (!value || !chat) return
    onSend(chat.chatId, value)
    setText('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <main className="chat">
      <header className="chat__header">
        <button className="chat__back link" onClick={onBack} aria-label="Назад">
          ←
        </button>
        <Avatar title={chat.title} />
        <div>
          <div className="chat__title">{chat.title}</div>
          <div className="chat__subtitle">{chat.chatId}</div>
        </div>
      </header>

      <div className="chat__messages" ref={listRef}>
        {chat.messages.map((m) => (
          <div key={m.id} className={`msg ${m.outgoing ? 'msg--out' : 'msg--in'}`}>
            <div className="msg__text">{m.text}</div>
            <div className="msg__meta">
              {new Date(m.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              {m.outgoing && m.status && (
                <span className={`msg__status msg__status--${m.status}`}>{STATUS_ICON[m.status]}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Сообщение"
          rows={1}
          maxLength={4000}
          autoFocus
        />
        <button className="composer__send" type="submit" disabled={!text.trim()} aria-label="Отправить">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
          </svg>
        </button>
      </form>
    </main>
  )
}
