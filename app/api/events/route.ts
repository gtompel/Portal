import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/events - Получить все события
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
    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const userId = searchParams.get("userId")

    const whereClause: any = {}

    if (type && type !== "all") {
      whereClause.type = type
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ]
    }

    // Фильтрация по диапазону дат
    if (startDate || endDate) {
      whereClause.date = {}

      if (startDate) {
        whereClause.date.gte = new Date(startDate)
      }

      if (endDate) {
        whereClause.date.lte = new Date(endDate)
      }
    }

    // Фильтрация по участнику
    if (userId) {
      whereClause.OR = [
        { creatorId: userId },
        {
          participants: {
            some: {
              userId: userId,
            },
          },
        },
      ]
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        startTime: true,
        endTime: true,
        location: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        participants: {
          select: {
            id: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                initials: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
      take: 50, // Ограничиваем количество событий для производительности
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error("Ошибка при получении событий:", error)
    return NextResponse.json({ error: "Ошибка при получении событий" }, { status: 500 })
  }
}

// POST /api/events - Создать новое событие
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Проверка обязательных полей
    if (!body.title || !body.date || !body.startTime || !body.endTime || !body.creatorId) {
      return NextResponse.json(
        { error: "Название, дата, время начала, время окончания и ID создателя обязательны" },
        { status: 400 },
      )
    }

    // Создание события
    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description || null,
        date: new Date(body.date + 'T00:00:00'),
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location || null,
        type: body.type || "MEETING",
        creatorId: body.creatorId,
        participants: {
          create:
            body.participants?.map((participantId: string) => ({
              userId: participantId,
              status: "PENDING",
            })) || [],
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                initials: true,
              },
            },
          },
        },
      },
    })

    // Создаём уведомления для участников события
    if (body.participants && body.participants.length > 0) {
      await prisma.notification.createMany({
        data: body.participants.map((participantId: string) => ({
          type: "EVENT",
          userId: participantId,
          eventId: event.id,
          read: false,
        })),
      });
    }

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании события:", error)
    return NextResponse.json({ error: "Ошибка при создании события" }, { status: 500 })
  }
}

