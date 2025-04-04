import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/messages - Получить сообщения
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const senderId = searchParams.get("senderId")
    const receiverId = searchParams.get("receiverId")

    if (!senderId && !receiverId) {
      return NextResponse.json({ error: "Необходимо указать senderId или receiverId" }, { status: 400 })
    }

    let whereClause = {}

    if (senderId && receiverId) {
      // Получаем диалог между двумя пользователями
      whereClause = {
        OR: [
          {
            senderId: senderId,
            receiverId: receiverId,
          },
          {
            senderId: receiverId,
            receiverId: senderId,
          },
        ],
      }
    } else if (senderId) {
      // Получаем сообщения, отправленные пользователем
      whereClause = {
        senderId: senderId,
      }
    } else if (receiverId) {
      // Получаем сообщения, полученные пользователем
      whereClause = {
        receiverId: receiverId,
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
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
        attachments: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Ошибка при получении сообщений:", error)
    return NextResponse.json({ error: "Ошибка при получении сообщений" }, { status: 500 })
  }
}

// POST /api/messages - Отправить сообщение
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Проверка обязательных полей
    if (!body.content || !body.senderId || !body.receiverId) {
      return NextResponse.json(
        { error: "Содержание сообщения, ID отправителя и ID получателя обязательны" },
        { status: 400 },
      )
    }

    // Проверяем, существуют ли пользователи
    const sender = await prisma.user.findUnique({
      where: { id: body.senderId },
    })

    if (!sender) {
      return NextResponse.json({ error: "Отправитель не найден" }, { status: 404 })
    }

    const receiver = await prisma.user.findUnique({
      where: { id: body.receiverId },
    })

    if (!receiver) {
      return NextResponse.json({ error: "Получатель не найден" }, { status: 404 })
    }

    // Создаем сообщение
    const message = await prisma.message.create({
      data: {
        content: body.content,
        senderId: body.senderId,
        receiverId: body.receiverId,
        read: false,
        attachments: {
          create:
            body.attachments?.map((attachment: any) => ({
              name: attachment.name,
              url: attachment.url,
              type: attachment.type,
            })) || [],
        },
      },
      include: {
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
        attachments: true,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Ошибка при отправке с��общения:", error)
    return NextResponse.json({ error: "Ошибка при отправке сообщения" }, { status: 500 })
  }
}

