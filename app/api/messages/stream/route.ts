import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/messages/stream - SSE endpoint для real-time сообщений
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = token.sub
    const searchParams = request.nextUrl.searchParams
    const otherUserId = searchParams.get("otherUserId")

    if (!otherUserId) {
      return NextResponse.json({ error: "Missing otherUserId parameter" }, { status: 400 })
    }

    const response = new Response(
      new ReadableStream({
        start(controller) {
          const sendData = (data: any) => {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`))
          }

          // Отправляем начальное состояние
          const sendInitialMessages = async () => {
            try {
              const messages = await prisma.message.findMany({
                where: {
                  OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                  ]
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
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
                  },
                  attachments: {
                    select: {
                      id: true,
                      name: true,
                      url: true,
                      type: true
                    }
                  }
                }
              })

              sendData({
                type: 'initial',
                messages: messages.reverse(),
                timestamp: Date.now()
              })
            } catch (error) {
              console.error("Ошибка отправки начальных сообщений:", error)
            }
          }

          sendInitialMessages()

          // Отправляем обновления каждые 5 секунд
          const messageUpdate = setInterval(async () => {
            try {
              const messages = await prisma.message.findMany({
                where: {
                  OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                  ]
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
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
                  },
                  attachments: {
                    select: {
                      id: true,
                      name: true,
                      url: true,
                      type: true
                    }
                  }
                }
              })

              sendData({
                type: 'message_update',
                messages: messages.reverse(),
                timestamp: Date.now()
              })
            } catch (error) {
              console.error("Ошибка обновления сообщений:", error)
            }
          }, 5000)

          // Очистка при закрытии соединения
          request.signal.addEventListener('abort', () => {
            clearInterval(messageUpdate)
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
    console.error("Ошибка SSE сообщений:", error)
    return NextResponse.json({ error: "Ошибка SSE" }, { status: 500 })
  }
} 