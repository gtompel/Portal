import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

type Message = {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  read: boolean
  attachments?: { id: string; name: string; url: string; type: string }[]
  sender: {
    id: string
    name: string
    avatar: string | null
    initials: string
  }
  receiver: {
    id: string
    name: string
    avatar: string | null
    initials: string
  }
}

export function useMessageStream(otherUserId: string | null) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectSSE = useCallback(() => {
    if (!session?.user?.id || !otherUserId) return

    try {
      const eventSource = new EventSource(`/api/messages/stream?otherUserId=${otherUserId}`)

      eventSource.onopen = () => {
        setIsConnected(true)
        setError(null)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'initial' || data.type === 'message_update') {
            setMessages(data.messages || [])
          }
        } catch (err) {
          console.error('Ошибка парсинга SSE данных сообщений:', err)
        }
      }

      eventSource.onerror = (error) => {
        setIsConnected(false)
        setError('Ошибка соединения с сервером')
        eventSource.close()
      }

      return eventSource
    } catch (err) {
      setError('Не удалось подключиться к серверу')
      return null
    }
  }, [session?.user?.id, otherUserId])

  useEffect(() => {
    let eventSource: EventSource | null = null

    if (session?.user?.id && otherUserId) {
      const source = connectSSE()
      if (source) {
        eventSource = source
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close()
        setIsConnected(false)
      }
    }
  }, [session?.user?.id, otherUserId, connectSSE])

  return {
    messages,
    isConnected,
    error
  }
} 