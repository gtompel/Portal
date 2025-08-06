import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

// Хранилище активных соединений (в памяти)
const connections = new Map<string, any>()

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const upgrade = request.headers.get('upgrade')
  
  if (upgrade !== 'websocket') {
    return new Response('Expected websocket', { status: 426 })
  }

  // Для Next.js используем Server-Sent Events вместо WebSocket
  return new Response(
    new ReadableStream({
      start(controller) {
        const userId = session.user.id
        
        // Сохраняем соединение
        connections.set(userId, controller)
        
        // Отправляем подтверждение подключения
        const message = JSON.stringify({
          type: 'connection',
          userId: userId,
          message: 'Connected to call service'
        })
        
        controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`))
        
        console.log(`SSE connected for user: ${userId}`)
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  )
}

function handleCallOffer(callerId: string, data: any) {
  const { receiverId, callType, callId } = data
  
  const receiverController = connections.get(receiverId)
  if (receiverController) {
    const message = JSON.stringify({
      type: 'incoming_call',
      callerId,
      callType,
      callId
    })
    
    receiverController.enqueue(new TextEncoder().encode(`data: ${message}\n\n`))
  }
}

function handleCallAnswer(userId: string, data: any) {
  const { callId, answer } = data
  
  // Находим звонящего
  const callerController = connections.get(data.callerId)
  if (callerController) {
    const message = JSON.stringify({
      type: 'call_answered',
      callId,
      answer,
      userId
    })
    
    callerController.enqueue(new TextEncoder().encode(`data: ${message}\n\n`))
  }
}

function handleCallEnd(userId: string, data: any) {
  const { callId, targetUserId } = data
  
  const targetController = connections.get(targetUserId)
  if (targetController) {
    const message = JSON.stringify({
      type: 'call_ended',
      callId,
      userId
    })
    
    targetController.enqueue(new TextEncoder().encode(`data: ${message}\n\n`))
  }
}

function handleIceCandidate(userId: string, data: any) {
  const { targetUserId, candidate } = data
  
  const targetController = connections.get(targetUserId)
  if (targetController) {
    const message = JSON.stringify({
      type: 'ice_candidate',
      candidate,
      userId
    })
    
    targetController.enqueue(new TextEncoder().encode(`data: ${message}\n\n`))
  }
}

function handleWebRTCOffer(userId: string, data: any) {
  const { targetUserId, offer } = data
  
  const targetController = connections.get(targetUserId)
  if (targetController) {
    const message = JSON.stringify({
      type: 'webrtc_offer',
      offer,
      userId
    })
    
    targetController.enqueue(new TextEncoder().encode(`data: ${message}\n\n`))
  }
}

function handleWebRTCAnswer(userId: string, data: any) {
  const { targetUserId, answer } = data
  
  const targetController = connections.get(targetUserId)
  if (targetController) {
    const message = JSON.stringify({
      type: 'webrtc_answer',
      answer,
      userId
    })
    
    targetController.enqueue(new TextEncoder().encode(`data: ${message}\n\n`))
  }
}

// Функция для отправки уведомлений о звонках
export function sendCallNotification(userId: string, notification: any) {
  const controller = connections.get(userId)
  if (controller) {
    const message = JSON.stringify({
      type: 'call_notification',
      ...notification
    })
    
    controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`))
  }
} 