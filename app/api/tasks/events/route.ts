import { NextRequest } from 'next/server'
import { taskEvents } from '@/lib/events'

export async function GET(request: NextRequest) {
  try {
    const stream = new ReadableStream({
      start(controller) {
        // Функция для отправки события клиенту
        const sendEvent = (data: any) => {
          try {
            const eventData = `data: ${JSON.stringify(data)}\n\n`
            controller.enqueue(new TextEncoder().encode(eventData))
          } catch (error) {
            console.error('Error sending SSE event:', error)
          }
        }

        // Отправляем начальное сообщение
        sendEvent({ 
          type: 'connected', 
          message: 'SSE connection established',
          timestamp: Date.now()
        })

        // Подписываемся на события изменений задач
        const handleTaskChange = (event: any) => {
          sendEvent(event)
        }

        taskEvents.on('task_change', handleTaskChange)

        // Обработка закрытия соединения
        request.signal.addEventListener('abort', () => {
          taskEvents.off('task_change', handleTaskChange)
          controller.close()
        })

        // Отправляем ping каждые 30 секунд для поддержания соединения
        const pingInterval = setInterval(() => {
          sendEvent({ 
            type: 'ping', 
            timestamp: Date.now() 
          })
        }, 30000)

        // Очистка при закрытии
        request.signal.addEventListener('abort', () => {
          clearInterval(pingInterval)
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'X-Accel-Buffering': 'no', // Отключаем буферизацию для nginx
      },
    })
  } catch (error) {
    console.error('SSE API error:', error)
    return new Response('SSE Error', { status: 500 })
  }
} 