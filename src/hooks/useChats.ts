import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type Credentials,
  chatTitle,
  deleteNotification,
  extractText,
  receiveNotification,
  sendMessage,
} from '../api/greenApi'
import type { Chat, Message } from '../types'

const storageKey = (idInstance: string) => `max-chat:chats:${idInstance}`

function loadChats(idInstance: string): Chat[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(idInstance)) ?? '[]') as Chat[]
  } catch {
    return []
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function useChats(credentials: Credentials) {
  const [chats, setChats] = useState<Chat[]>(() => loadChats(credentials.idInstance))
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [pollError, setPollError] = useState<string | null>(null)
  const activeRef = useRef(activeChatId)
  useEffect(() => {
    activeRef.current = activeChatId
  }, [activeChatId])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(credentials.idInstance), JSON.stringify(chats))
    } catch {
      /* хранилище недоступно — работаем в памяти */
    }
  }, [chats, credentials.idInstance])

  /** Добавляет сообщение в чат (создавая чат при необходимости), без дублей по id. */
  const addMessage = useCallback((chatId: string, message: Message) => {
    setChats((prev) => {
      const existing = prev.find((c) => c.chatId === chatId)
      if (existing?.messages.some((m) => m.id === message.id)) return prev
      // уведомление об отправленном через API сообщении может прийти раньше ответа sendMessage
      if (
        message.outgoing &&
        !message.id.startsWith('local-') &&
        existing?.messages.some((m) => m.status === 'sending' && m.text === message.text)
      ) {
        return prev
      }
      const isActive = activeRef.current === chatId
      const updated: Chat = existing
        ? {
            ...existing,
            messages: [...existing.messages, message],
            unread: existing.unread + (!message.outgoing && !isActive ? 1 : 0),
          }
        : {
            chatId,
            title: chatTitle(chatId),
            messages: [message],
            unread: message.outgoing || isActive ? 0 : 1,
          }
      // поднимаем чат с новым сообщением наверх списка
      return [updated, ...prev.filter((c) => c.chatId !== chatId)]
    })
  }, [])

  const updateMessage = useCallback((chatId: string, id: string, patch: Partial<Message>) => {
    setChats((prev) =>
      prev.map((c) =>
        c.chatId !== chatId
          ? c
          : { ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) },
      ),
    )
  }, [])

  // Цикл получения входящих уведомлений (HTTP API: receiveNotification + deleteNotification)
  useEffect(() => {
    const controller = new AbortController()
    let stopped = false

    async function loop() {
      while (!stopped) {
        try {
          const notification = await receiveNotification(credentials, 20, controller.signal)
          setPollError(null)
          if (!notification) continue

          const { body, receiptId } = notification
          const chatId = body.senderData?.chatId
          const text = extractText(body)
          const isIncoming = body.typeWebhook === 'incomingMessageReceived'
          const isOutgoing =
            body.typeWebhook === 'outgoingMessageReceived' ||
            body.typeWebhook === 'outgoingAPIMessageReceived'

          if (chatId && text !== null && (isIncoming || isOutgoing)) {
            addMessage(chatId, {
              id: body.idMessage ?? String(receiptId),
              text,
              outgoing: isOutgoing,
              timestamp: (body.timestamp ?? Date.now() / 1000) * 1000,
              status: isOutgoing ? 'sent' : undefined,
            })
          }

          // удаляем уведомление из очереди, иначе оно будет приходить повторно
          await deleteNotification(credentials, receiptId)
        } catch (e) {
          if (stopped) return
          setPollError(e instanceof Error ? e.message : String(e))
          await sleep(5000)
        }
      }
    }

    loop()
    return () => {
      stopped = true
      controller.abort()
    }
  }, [credentials, addMessage])

  const openChat = useCallback((chatId: string) => {
    setActiveChatId(chatId)
    setChats((prev) => {
      if (prev.some((c) => c.chatId === chatId)) {
        return prev.map((c) => (c.chatId === chatId ? { ...c, unread: 0 } : c))
      }
      return [{ chatId, title: chatTitle(chatId), messages: [], unread: 0 }, ...prev]
    })
  }, [])

  const send = useCallback(
    async (chatId: string, text: string) => {
      const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
      addMessage(chatId, {
        id: tempId,
        text,
        outgoing: true,
        timestamp: Date.now(),
        status: 'sending',
      })
      try {
        const { idMessage } = await sendMessage(credentials, chatId, text)
        // подменяем временный id на настоящий, чтобы не задублировать сообщение
        // при приходе уведомления outgoingAPIMessageReceived
        updateMessage(chatId, tempId, { id: idMessage, status: 'sent' })
      } catch {
        updateMessage(chatId, tempId, { status: 'error' })
      }
    },
    [credentials, addMessage, updateMessage],
  )

  const activeChat = chats.find((c) => c.chatId === activeChatId) ?? null

  return { chats, activeChat, openChat, send, pollError }
}
