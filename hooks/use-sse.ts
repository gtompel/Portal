import { useEffect, useRef, useState } from 'react'

interface SSEOptions {
  onMessage?: (event: MessageEvent) => void
  onOpen?: () => void
  onError?: (error: Event) => void
  onClose?: () => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useSSE(url: string, options: SSEOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Event | null>(null)

  const {
    onMessage,
    onOpen,
    onError,
    onClose,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5
  } = options

  const connect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Не подключаемся если URL пустой
    if (!url) {
      setIsConnected(false)
      return
    }

    // Для Vercel используем polling
    if (process.env.VERCEL || window.location.hostname.includes('vercel.app')) {
      console.log('Using polling for Vercel deployment')
      setIsConnected(true)
      onOpen?.()
      
      let lastCheck = Date.now()
      
      // Polling каждые 5 секунд
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/tasks/changes?lastCheck=${lastCheck}`)
          if (response.ok) {
            const data = await response.json()
            if (data.type === 'changes') {
              lastCheck = data.timestamp
              
              // Если есть изменения, отправляем события
              if (data.hasChanges) {
                // Отправляем события для каждой измененной задачи
                data.changedTasks.forEach((task: any) => {
                  onMessage?.(new MessageEvent('message', {
                    data: JSON.stringify({
                      type: 'task_updated',
                      taskId: task.id,
                      task: task,
                      timestamp: Date.now()
                    })
                  }))
                })
                
                // Если есть новые задачи
                if (data.newTasksCount > 0) {
                  onMessage?.(new MessageEvent('message', {
                    data: JSON.stringify({
                      type: 'task_created',
                      newTasksCount: data.newTasksCount,
                      timestamp: Date.now()
                    })
                  }))
                }
              } else {
                // Отправляем ping если изменений нет
                onMessage?.(new MessageEvent('message', {
                  data: JSON.stringify({ type: 'ping', timestamp: Date.now() })
                }))
              }
            }
          }
        } catch (error) {
          console.error('Polling error:', error)
        }
      }, 5000)

      // Сохраняем interval для очистки
      eventSourceRef.current = { close: () => clearInterval(pollInterval) } as any
      return
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Connecting to SSE:', url)
      }
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('SSE connection opened')
        }
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
        onOpen?.()
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (process.env.NODE_ENV === 'development') {
            console.log('SSE message received:', data)
          }
          
          // Игнорируем ping сообщения
          if (data.type === 'ping') {
            return
          }
          
          onMessage?.(event)
        } catch (err) {
          console.error('Error parsing SSE message:', err)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        setIsConnected(false)
        setError(error)
        onError?.(error)

        // Попытка переподключения только если соединение было закрыто
        if (eventSource.readyState === EventSource.CLOSED) {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            if (process.env.NODE_ENV === 'development') {
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
        }
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++
              connect()
            }, reconnectInterval)
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('Max reconnection attempts reached')
            }
          }
        }
      }

      // EventSource не имеет onclose, используем onerror для определения закрытия
      // onClose будет вызван в onerror или при размонтировании компонента
    } catch (err) {
      console.error('Error creating EventSource:', err)
      setError(err as Event)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsConnected(false)
    reconnectAttemptsRef.current = 0
  }

  useEffect(() => {
    // Не подключаемся если URL пустой
    if (!url) {
      setIsConnected(false)
      return
    }

    connect()

    return () => {
      disconnect()
    }
  }, [url])

  return {
    isConnected,
    error,
    disconnect,
    connect
  }
} 