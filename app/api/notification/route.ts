import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/notifications - Получить уведомления для пользователя
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Необходимо указать userId" }, { status: 400 })
    }

    // Получаем текущую дату и дату через 3 дня
    const now = new Date()
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(now.getDate() + 3)

    // Получаем события, в которых пользователь участвует
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { creatorId: userId },
          {
            participants: {
              some: {
                userId: userId,
              },
            },
          },
        ],
        date: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Получаем задачи, назначенные пользователю
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: {
          not: "COMPLETED",
        },
        dueDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Получаем непрочитанные сообщения для пользователя
    const messages = await prisma.message.findMany({
      where: {
        receiverId: userId,
        read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5, // Ограничиваем количество сообщений
    })

    // Формируем уведомления
    const eventNotifications = events.map((event) => ({
      id: `event-${event.id}`,
      type: "EVENT",
      title: event.title,
      description: `Событие состоится ${new Date(event.date).toLocaleDateString("ru-RU")} в ${event.startTime}`,
      date: event.date,
      createdAt: event.createdAt,
      read: false,
      entityId: event.id,
      creatorName: event.creator.name,
    }))

    const taskNotifications = tasks.map((task) => ({
      id: `task-${task.id}`,
      type: "TASK",
      title: task.title,
      description: `Срок выполнения задачи: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString("ru-RU") : "Не указан"}`,
      date: task.dueDate,
      createdAt: task.createdAt,
      read: false,
      entityId: task.id,
      creatorName: task.creator.name,
    }))

    const messageNotifications = messages.map((message) => ({
      id: `message-${message.id}`,
      type: "MESSAGE",
      title: `Сообщение от ${message.sender.name}`,
      description: message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content,
      date: null,
      createdAt: message.createdAt,
      read: false,
      entityId: message.id,
      creatorName: message.sender.name,
    }))

    // Объединяем и сортируем уведомления по дате создания (сначала новые)
    const notifications = [...eventNotifications, ...taskNotifications, ...messageNotifications].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Ошибка при получении уведомлений:", error)
    return NextResponse.json({ error: "Ошибка при получении уведомлений" }, { status: 500 })
  }
}

// PUT /api/notifications - Отметить уведомления как прочитанные
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationIds, userId } = body

    if (!notificationIds || !userId) {
      return NextResponse.json({ error: "Необходимо указать notificationIds и userId" }, { status: 400 })
    }

    // В реальном приложении здесь был бы код для обновления статуса уведомлений в базе данных
    // Поскольку у нас нет отдельной таблицы для уведомлений, мы просто возвращаем успешный ответ

    return NextResponse.json({ message: "Уведомления отмечены как прочитанные" })
  } catch (error) {
    console.error("Ошибка при обновлении уведомлений:", error)
    return NextResponse.json({ error: "Ошибка при обновлении уведомлений" }, { status: 500 })
  }
}

