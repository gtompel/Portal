import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/messages/[id] - Получить сообщение по ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const message = await prisma.message.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        content: true,
        read: true,
        createdAt: true,
        updatedAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        attachments: {
          select: {
            id: true,
            name: true,
            url: true,
            type: true,
          },
        },
      },
    })

    if (!message) {
      return NextResponse.json({ error: "Сообщение не найдено" }, { status: 404 })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Ошибка при получении сообщения:", error)
    return NextResponse.json({ error: "Ошибка при получении сообщения" }, { status: 500 })
  }
}

// PUT /api/messages/[id] - Обновить сообщение (например, отметить как прочитанное)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const body = await request.json()

    // Проверяем, существует ли сообщение
    const existingMessage = await prisma.message.findUnique({
      where: { id: params.id },
    })

    if (!existingMessage) {
      return NextResponse.json({ error: "Сообщение не найдено" }, { status: 404 })
    }

    // Подготавливаем данные для обновления
    const updateData: any = {}

    // Обновляем только предоставленные поля
    if (body.read !== undefined) updateData.read = body.read
    if (body.content !== undefined) updateData.content = body.content

    // Обновляем сообщение
    const updatedMessage = await prisma.message.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        content: true,
        read: true,
        createdAt: true,
        updatedAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        attachments: {
          select: {
            id: true,
            name: true,
            url: true,
            type: true,
          },
        },
      },
    })

    return NextResponse.json(updatedMessage)
  } catch (error) {
    console.error("Ошибка при обновлении сообщения:", error)
    return NextResponse.json({ error: "Ошибка при обновлении сообщения" }, { status: 500 })
  }
}

// DELETE /api/messages/[id] - Удалить сообщение
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    // Проверяем, существует ли сообщение
    const existingMessage = await prisma.message.findUnique({
      where: { id: params.id },
    })

    if (!existingMessage) {
      return NextResponse.json({ error: "Сообщение не найдено" }, { status: 404 })
    }

    // Удаляем сообщение
    await prisma.message.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Сообщение успешно удалено" })
  } catch (error) {
    console.error("Ошибка при удалении сообщения:", error)
    return NextResponse.json({ error: "Ошибка при удалении сообщения" }, { status: 500 })
  }
}

