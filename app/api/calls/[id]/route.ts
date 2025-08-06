import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()
    const { id: callId } = await params

    // Получаем звонок
    const call = await prisma.call.findUnique({
      where: { id: callId }
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // Проверяем, что пользователь участвует в звонке
    if (call.callerId !== session.user.id && call.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to modify this call' }, { status: 403 })
    }

    // Обновляем статус звонка
    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: {
        status,
        ...(status === 'ENDED' && { endTime: new Date() }),
        ...(status === 'ACTIVE' && { answerTime: new Date() })
      }
    })

    // Создаем уведомление только о пропущенных звонках
    if (status === 'ENDED' && call.status === 'RINGING') {
      try {
        // Уведомляем получателя о пропущенном звонке
        await prisma.notification.create({
          data: {
            type: 'CALL_MISSED',
            userId: call.receiverId,
            read: false
          }
        })
      } catch (error) {
        console.error('Error creating missed call notification:', error)
      }
    }

    return NextResponse.json(updatedCall)

  } catch (error) {
    console.error('Call update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: callId } = await params

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        caller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true
          }
        }
      }
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // Проверяем, что пользователь участвует в звонке
    if (call.callerId !== session.user.id && call.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to view this call' }, { status: 403 })
    }

    return NextResponse.json(call)

  } catch (error) {
    console.error('Call retrieval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 