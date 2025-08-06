import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/users/status - SSE endpoint для отслеживания статуса пользователей
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

    // Устанавливаем заголовки для SSE
    const response = new Response(
      new ReadableStream({
        start(controller) {
          const sendData = (data: any) => {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`))
          }

          // Отправляем начальное состояние
          const sendInitialStatus = async () => {
            try {
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

              const usersWithStatus = users.map(user => {
                const lastSeen = user.activity?.lastSeen
                const isActuallyOnline = user.activity?.isOnline && lastSeen && lastSeen > fiveMinutesAgo
                
                return {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  avatar: user.avatar,
                  status: user.status,
                  isOnline: isActuallyOnline
                }
              })

              sendData({
                type: 'initial',
                users: usersWithStatus,
                timestamp: Date.now()
              })


            } catch (error) {
              console.error("Ошибка отправки начального статуса:", error)
            }
          }

          sendInitialStatus()

          // Отправляем обновления статуса каждые 10 секунд для более быстрого отклика
          const statusUpdate = setInterval(async () => {
            try {
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

              const usersWithStatus = users.map(user => {
                const lastSeen = user.activity?.lastSeen
                const isActuallyOnline = user.activity?.isOnline && lastSeen && lastSeen > fiveMinutesAgo
                
                return {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  avatar: user.avatar,
                  status: user.status,
                  isOnline: isActuallyOnline
                }
              })

              sendData({
                type: 'status_update',
                users: usersWithStatus,
                timestamp: Date.now()
              })


            } catch (error) {
              console.error("Ошибка обновления статуса:", error)
            }
          }, 30000) // Увеличили интервал до 30 секунд

          // Очистка при закрытии соединения
          request.signal.addEventListener('abort', () => {
            clearInterval(statusUpdate)
            controller.close()
          })
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        }
      }
    )

    return response
  } catch (error) {
    console.error("Ошибка SSE:", error)
    return NextResponse.json({ error: "Ошибка SSE" }, { status: 500 })
  }
}

// POST /api/users/status - Обновить статус пользователя
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, isOnline } = body

    // Здесь можно добавить логику для обновления статуса в базе данных
    // Например, обновить lastSeen или создать отдельную таблицу для статусов

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка обновления статуса:", error)
    return NextResponse.json({ error: "Ошибка обновления статуса" }, { status: 500 })
  }
} 