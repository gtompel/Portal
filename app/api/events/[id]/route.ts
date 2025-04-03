import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/events/[id] - Получить событие по ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
            email: true,
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
                email: true,
              },
            },
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Событие не найдено" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Ошибка при получении события:", error)
    return NextResponse.json({ error: "Ошибка при получении события" }, { status: 500 })
  }
}

// PUT /api/events/[id] - Обновить событие
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // Проверяем, существует ли событие
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Событие не найдено" }, { status: 404 })
    }

    // Подготавливаем данные для обновления
    const updateData: any = {}

    // Обновляем только предоставленные поля
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.startTime !== undefined) updateData.startTime = body.startTime
    if (body.endTime !== undefined) updateData.endTime = body.endTime
    if (body.location !== undefined) updateData.location = body.location
    if (body.type !== undefined) updateData.type = body.type

    // Обновляем событие
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error("Ошибка при обновлении события:", error)
    return NextResponse.json({ error: "Ошибка при обновлении события" }, { status: 500 })
  }
}

// DELETE /api/events/[id] - Удалить событие
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Проверяем, существует ли событие
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Событие не найдено" }, { status: 404 })
    }

    // Удаляем событие
    await prisma.event.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Событие успешно удалено" })
  } catch (error) {
    console.error("Ошибка при удалении события:", error)
    return NextResponse.json({ error: "Ошибка при удалении события" }, { status: 500 })
  }
}

