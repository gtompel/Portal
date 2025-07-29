import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/notifications - Получить уведомления для пользователя
export async function GET(request: NextRequest) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Необходимо указать userId" }, { status: 400 })
    }

    // Получаем уведомления для пользователя из базы данных
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        event: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        task: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        message: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        announcement: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Преобразуем уведомления в формат, который будет отправлен клиенту
    const formattedNotifications = notifications.map((notification) => {
      switch (notification.type) {
        case "EVENT":
          return {
            id: notification.id,
            type: notification.type,
            title: notification.event?.title || "Событие",
            description: `Событие состоится ${notification.event?.date ? new Date(notification.event.date).toLocaleDateString("ru-RU") : "дата не указана"} в ${notification.event?.startTime}`,
            date: notification.event?.date,
            createdAt: notification.createdAt,
            read: notification.read,
            entityId: notification.eventId,
            creatorName: notification.event?.creator?.name,
          }
        case "TASK":
          return {
            id: notification.id,
            type: notification.type,
            title: notification.task?.title || "Задача",
            description: `Срок выполнения задачи: ${notification.task?.dueDate ? new Date(notification.task.dueDate).toLocaleDateString("ru-RU") : "Не указан"}`,
            date: notification.task?.dueDate,
            createdAt: notification.createdAt,
            read: notification.read,
            entityId: notification.taskId,
            creatorName: notification.task?.creator?.name,
          }
        case "MESSAGE":
          return {
            id: notification.id,
            type: notification.type,
            title: `Сообщение от ${notification.message?.sender?.name || "Неизвестный отправитель"}`,
            description: notification.message?.content ? (notification.message.content.length > 50 ? `${notification.message.content.substring(0, 50)}...` : notification.message.content) : "Нет содержимого",
            date: null,
            createdAt: notification.createdAt,
            read: notification.read,
            entityId: notification.messageId,
            creatorName: notification.message?.sender?.name,
          }
        case "ANNOUNCEMENT":
          return {
            id: notification.id,
            type: notification.type,
            title: notification.announcement?.title || "Объявление",
            description: notification.announcement?.content ? (notification.announcement.content.length > 50 ? `${notification.announcement.content.substring(0, 50)}...` : notification.announcement.content) : "Нет содержимого",
            date: null,
            createdAt: notification.createdAt,
            read: notification.read,
            entityId: notification.announcementId,
            creatorName: notification.announcement?.author?.name,
          }
        default:
          return null
      }
    }).filter(Boolean) // Фильтруем null значения

    return NextResponse.json(formattedNotifications)
  } catch (error) {
    console.error("Ошибка при получении уведомлений:", error)
    return NextResponse.json({ error: "Ошибка при получении уведомлений" }, { status: 500 })
  }
}

// PUT /api/notifications - Отметить уведомления как прочитанные
export async function PUT(request: NextRequest) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const body = await request.json()
    const { notificationIds } = body

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: "Необходимо указать notificationIds в виде массива" }, { status: 400 })
    }

    // Обновляем статус уведомлений в базе данных
    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
      },
      data: {
        read: true,
      },
    })

    return NextResponse.json({ message: "Уведомления отмечены как прочитанные" })
  } catch (error) {
    console.error("Ошибка при обновлении уведомлений:", error)
    return NextResponse.json({ error: "Ошибка при обновлении уведомлений" }, { status: 500 })
  }
}
