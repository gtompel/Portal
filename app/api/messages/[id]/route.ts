import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: messageId } = await params

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
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

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Проверяем, что пользователь участвует в сообщении
    if (message.senderId !== session.user.id && message.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to view this message' }, { status: 403 })
    }

    return NextResponse.json(message)

  } catch (error) {
    console.error('Message retrieval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/messages/[id] - Обновить сообщение (например, отметить как прочитанное)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const body = await request.json()
    const { id: messageId } = await params

    // Проверяем, существует ли сообщение
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!existingMessage) {
      return NextResponse.json({ error: "Сообщение не найдено" }, { status: 404 })
    }

    // Подготавливаем данные для обновления
    const updateData: any = {}

    // Обновляем только предоставленные поля
    if (body.read !== undefined) updateData.read = body.read
    if (body.content !== undefined) updateData.content = body.content

    // Обновляем сообщение
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: updateData,
      select: {
        id: true,
        content: true,
        read: true,
        createdAt: true,
        updatedAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        attachments: {
          select: {
            id: true,
            name: true,
            url: true,
            type: true,
          },
        },
      },
    })

    return NextResponse.json(updatedMessage)
  } catch (error) {
    console.error("Ошибка при обновлении сообщения:", error)
    return NextResponse.json({ error: "Ошибка при обновлении сообщения" }, { status: 500 })
  }
}

// DELETE /api/messages/[id] - Удалить сообщение
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const { id: messageId } = await params
    
    // Проверяем, существует ли сообщение
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    })

    if (!existingMessage) {
      return NextResponse.json({ error: "Сообщение не найдено" }, { status: 404 })
    }

    // Удаляем сообщение
    await prisma.message.delete({
      where: { id: messageId },
    })

    return NextResponse.json({ message: "Сообщение успешно удалено" })
  } catch (error) {
    console.error("Ошибка при удалении сообщения:", error)
    return NextResponse.json({ error: "Ошибка при удалении сообщения" }, { status: 500 })
  }
}

