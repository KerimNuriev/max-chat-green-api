import { type FormEvent, useState } from 'react'
import { toChatId } from '../api/greenApi'
import type { Chat } from '../types'
import { Avatar } from './Avatar'

interface Props {
  chats: Chat[]
  activeChatId: string | null
  onOpen: (chatId: string) => void
  onLogout: () => void
  idInstance: string
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function Sidebar({ chats, activeChatId, onOpen, onLogout, idInstance }: Props) {
  const [phone, setPhone] = useState('')

  function createChat(e: FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return
    onOpen(toChatId(phone))
    setPhone('')
  }

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <span className="sidebar__title">Чаты</span>
        <button className="link" onClick={onLogout} title={`Инстанс ${idInstance}`}>
          Выйти
        </button>
      </header>

      <form className="sidebar__new" onSubmit={createChat}>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Номер, напр. 79991234567"
          inputMode="tel"
        />
        <button className="btn btn--small" type="submit">
          Создать
        </button>
      </form>

      <ul className="chat-list">
        {chats.length === 0 && <li className="chat-list__empty">Пока нет чатов</li>}
        {chats.map((chat) => {
          const last = chat.messages[chat.messages.length - 1]
          return (
            <li key={chat.chatId}>
              <button
                className={`chat-item ${chat.chatId === activeChatId ? 'chat-item--active' : ''}`}
                onClick={() => onOpen(chat.chatId)}
              >
                <Avatar title={chat.title} />
                <div className="chat-item__body">
                  <div className="chat-item__row">
                    <span className="chat-item__title">{chat.title}</span>
                    {last && <span className="chat-item__time">{formatTime(last.timestamp)}</span>}
                  </div>
                  <div className="chat-item__row">
                    <span className="chat-item__preview">
                      {last ? (last.outgoing ? 'Вы: ' : '') + last.text : 'Нет сообщений'}
                    </span>
                    {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
