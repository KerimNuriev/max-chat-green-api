export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export interface Notification {
  receiptId: number
  body: {
    typeWebhook: string
    idMessage?: string
    timestamp?: number
    senderData?: {
      chatId: string
      sender?: string
      senderName?: string
    }
    messageData?: {
      typeMessage: string
      textMessageData?: { textMessage: string }
      extendedTextMessageData?: { text: string }
    }
  }
}

function base({ apiUrl, idInstance }: Credentials): string {
  return `${apiUrl.replace(/\/+$/, '')}/waInstance${idInstance}`
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`GREEN-API: ${res.status} ${res.statusText}`)
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

/** Проверка учётных данных: возвращает состояние инстанса (authorized, notAuthorized, ...). */
export function getStateInstance(c: Credentials) {
  return request<{ stateInstance: string }>(`${base(c)}/getStateInstance/${c.apiTokenInstance}`)
}

/** https://green-api.com/v3/docs/api/sending/SendMessage/ */
export function sendMessage(c: Credentials, chatId: string, message: string) {
  return request<{ idMessage: string }>(`${base(c)}/sendMessage/${c.apiTokenInstance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
}

/** Long-polling: ждёт уведомление до receiveTimeout секунд, при пустой очереди возвращает null. */
export function receiveNotification(c: Credentials, receiveTimeout = 20, signal?: AbortSignal) {
  return request<Notification | null>(
    `${base(c)}/receiveNotification/${c.apiTokenInstance}?receiveTimeout=${receiveTimeout}`,
    { signal },
  )
}

export function deleteNotification(c: Credentials, receiptId: number) {
  return request<{ result: boolean }>(
    `${base(c)}/deleteNotification/${c.apiTokenInstance}/${receiptId}`,
    { method: 'DELETE' },
  )
}

/** Номер телефона → chatId. Если пользователь ввёл готовый chatId (с @ или числовой ID MAX), оставляем как есть. */
export function toChatId(input: string): string {
  const value = input.trim()
  if (value.includes('@') || value.startsWith('-')) return value
  const digits = value.replace(/\D/g, '')
  return `${digits}@c.us`
}

export function chatTitle(chatId: string): string {
  const [id] = chatId.split('@')
  return /^\d{10,15}$/.test(id) ? `+${id}` : id
}

/** Достаёт текст из уведомления, если это текстовое сообщение. */
export function extractText(n: Notification['body']): string | null {
  const data = n.messageData
  if (!data) return null
  if (data.typeMessage === 'textMessage') return data.textMessageData?.textMessage ?? null
  if (data.typeMessage === 'extendedTextMessage') return data.extendedTextMessageData?.text ?? null
  return null
}
