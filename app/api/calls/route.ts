import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiverId, callType } = await request.json()

    if (!receiverId || !callType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Проверяем, что получатель существует
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    })

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
    }

    // Создаем запись о звонке
    const call = await prisma.call.create({
      data: {
        callerId: session.user.id,
        receiverId,
        type: callType, // 'AUDIO' | 'VIDEO'
        status: 'RINGING',
        startTime: new Date()
      }
    })

    // Убираем все уведомления о звонках - они будут создаваться только при пропуске

    return NextResponse.json({ 
      callId: call.id,
      message: 'Call initiated successfully' 
    })

  } catch (error) {
    console.error('Call creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    // Получаем активные звонки пользователя
    const calls = await prisma.call.findMany({
      where: {
        OR: [
          { callerId: userId },
          { receiverId: userId }
        ],
        status: {
          in: ['RINGING', 'ACTIVE']
        }
      },
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
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    return NextResponse.json(calls)

  } catch (error) {
    console.error('Call retrieval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 