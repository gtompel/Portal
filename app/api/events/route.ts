import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/events - Получить все события
export async function GET(request: NextRequest) {
  try {
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
      orderBy: {
        date: "asc",
      },
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
        date: new Date(body.date),
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

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании события:", error)
    return NextResponse.json({ error: "Ошибка при создании события" }, { status: 500 })
  }
}

