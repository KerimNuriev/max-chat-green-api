import { useState } from 'react'
import type { Credentials } from './api/greenApi'
import { ChatWindow } from './components/ChatWindow'
import { Login } from './components/Login'
import { Sidebar } from './components/Sidebar'
import { useChats } from './hooks/useChats'

const CREDS_KEY = 'max-chat:credentials'

function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    return raw ? (JSON.parse(raw) as Credentials) : null
  } catch {
    return null
  }
}

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(loadCredentials)

  function login(c: Credentials) {
    try {
      localStorage.setItem(CREDS_KEY, JSON.stringify(c))
    } catch {
      /* ignore */
    }
    setCredentials(c)
  }

  function logout() {
    try {
      localStorage.removeItem(CREDS_KEY)
    } catch {
      /* ignore */
    }
    setCredentials(null)
  }

  if (!credentials) return <Login onLogin={login} />
  return <Messenger key={credentials.idInstance} credentials={credentials} onLogout={logout} />
}

function Messenger({ credentials, onLogout }: { credentials: Credentials; onLogout: () => void }) {
  const { chats, activeChat, openChat, send, pollError } = useChats(credentials)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  return (
    <div className={`app ${mobileShowChat && activeChat ? 'app--chat-open' : ''}`}>
      {pollError && <div className="banner">Ошибка получения сообщений: {pollError}. Повтор…</div>}
      <Sidebar
        chats={chats}
        activeChatId={activeChat?.chatId ?? null}
        onOpen={(id) => {
          openChat(id)
          setMobileShowChat(true)
        }}
        onLogout={onLogout}
        idInstance={credentials.idInstance}
      />
      <ChatWindow chat={activeChat} onSend={send} onBack={() => setMobileShowChat(false)} />
    </div>
  )
}
