export interface Message {
  id: string
  text: string
  outgoing: boolean
  timestamp: number
  status?: 'sending' | 'sent' | 'error'
}

export interface Chat {
  chatId: string
  title: string
  messages: Message[]
  unread: number
}
