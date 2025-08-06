import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// POST /api/users/activity - Обновить активность пользователя
export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { isOnline } = body

    // Обновляем или создаем запись активности пользователя
    const activity = await prisma.userActivity.upsert({
      where: {
        userId: token.sub
      },
      update: {
        isOnline,
        lastSeen: new Date()
      },
      create: {
        userId: token.sub,
        isOnline,
        lastSeen: new Date()
      }
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error("Ошибка обновления активности:", error)
    return NextResponse.json({ error: "Ошибка обновления активности" }, { status: 500 })
  }
}

// GET /api/users/activity - Получить активность всех пользователей
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

    // Получаем всех пользователей с их активностью
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        activity: {
          select: {
            isOnline: true,
            lastSeen: true
          }
        }
      }
    })

    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000) // 5 минут назад

    const usersWithActivity = users.map(user => {
      const lastSeen = user.activity?.lastSeen
      const isActuallyOnline = user.activity?.isOnline && lastSeen && lastSeen > fiveMinutesAgo
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        isOnline: isActuallyOnline,
        lastSeen: lastSeen || null
      }
    })

    return NextResponse.json(usersWithActivity)
  } catch (error) {
    console.error("Ошибка получения активности:", error)
    return NextResponse.json({ error: "Ошибка получения активности" }, { status: 500 })
  }
} 