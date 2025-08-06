import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

type UserStatus = {
  id: string
  name: string
  email: string
  avatar: string | null
  status: string
  isOnline: boolean
}

export function useUserStatus() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserStatus[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectSSE = useCallback(() => {
    if (!session?.user?.id) return

          // Для Vercel или если нужно принудительно использовать polling
      if (process.env.VERCEL || window.location.hostname.includes('vercel.app') || process.env.NEXT_PUBLIC_USE_POLLING === 'true') {
        setIsConnected(true)
        setError(null)
      
      let lastCheck = Date.now()
      
      // Начальная загрузка данных
      const initialLoad = async () => {
        try {
          const response = await fetch('/api/users/activity')
          if (response.ok) {
            const data = await response.json()
            setUsers(data || [])
            lastCheck = Date.now()
          }
        } catch (error) {
          setError('Ошибка соединения с сервером')
        }
      }
      
      // Выполняем начальную загрузку
      initialLoad()
      
      // Polling каждые 30 секунд
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/users/activity')
          if (response.ok) {
            const data = await response.json()
            setUsers(data || [])
            lastCheck = Date.now()
          }
        } catch (error) {
          setError('Ошибка соединения с сервером')
        }
      }, 10000)

      // Сохраняем interval для очистки
      return { close: () => clearInterval(pollInterval) } as any
    }

    try {
      const eventSource = new EventSource('/api/users/status')

      eventSource.onopen = () => {
        setIsConnected(true)
        setError(null)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'initial' || data.type === 'status_update') {
            setUsers(data.users || [])
          }
        } catch (err) {
          console.error('Ошибка парсинга SSE данных:', err)
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
  }, [session?.user?.id])

  useEffect(() => {
    let eventSource: EventSource | null = null

    if (session?.user?.id) {
      // Небольшая задержка для предотвращения одновременного подключения
      const timeoutId = setTimeout(() => {
        eventSource = connectSSE()
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        if (eventSource) {
          eventSource.close()
          setIsConnected(false)
        }
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close()
        setIsConnected(false)
      }
    }
  }, [session?.user?.id, connectSSE])

  // Функция для обновления статуса пользователя
  const updateUserStatus = useCallback(async (userId: string, isOnline: boolean) => {
    try {
      await fetch('/api/users/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, isOnline }),
      })
    } catch (err) {
      console.error('Ошибка обновления статуса:', err)
    }
  }, [])

  return {
    users,
    isConnected,
    error,
    updateUserStatus
  }
} 