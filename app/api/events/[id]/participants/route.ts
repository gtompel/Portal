import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/events/[id]/participants - Получить участников события
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
            email: true,
            position: true,
          },
        },
      },
    })

    return NextResponse.json(participants)
  } catch (error) {
    console.error("Ошибка при получении участников:", error)
    return NextResponse.json({ error: "Ошибка при получении участников" }, { status: 500 })
  }
}

// POST /api/events/[id]/participants - Добавить участника к событию
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const body = await request.json()

    // Проверка обязательных полей
    if (!body.userId) {
      return NextResponse.json({ error: "ID пользователя обязателен" }, { status: 400 })
    }

    // Проверяем, существует ли событие
    const event = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!event) {
      return NextResponse.json({ error: "Событие не найдено" }, { status: 404 })
    }

    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Проверяем, не является ли пользователь уже участником
    const existingParticipant = await prisma.eventParticipant.findFirst({
      where: {
        eventId: params.id,
        userId: body.userId,
      },
    })

    if (existingParticipant) {
      return NextResponse.json({ error: "Пользователь уже является участником события" }, { status: 400 })
    }

    // Добавляем участника
    const participant = await prisma.eventParticipant.create({
      data: {
        eventId: params.id,
        userId: body.userId,
        status: body.status || "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error("Ошибка при добавлении участника:", error)
    return NextResponse.json({ error: "Ошибка при добавлении участника" }, { status: 500 })
  }
}

