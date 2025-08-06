import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/messages/unread - Получить количество непрочитанных сообщений
export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Необходимо указать userId" }, { status: 400 })
    }

    // Получаем количество непрочитанных сообщений
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        read: false,
      },
    })

    // Получаем количество непрочитанных сообщений по отправителям
    const unreadBySender = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        read: false,
      },
      _count: {
        id: true,
      },
    })

    return NextResponse.json({
      totalUnread: unreadCount,
      unreadBySender: unreadBySender.map(item => ({
        senderId: item.senderId,
        count: item._count.id,
      })),
    })
  } catch (error) {
    console.error("Ошибка при получении непрочитанных сообщений:", error)
    return NextResponse.json({ error: "Ошибка при получении непрочитанных сообщений" }, { status: 500 })
  }
} 