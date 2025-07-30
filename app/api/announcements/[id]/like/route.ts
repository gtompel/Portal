import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"

// POST /api/announcements/[id]/like - Toggle лайка
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
    }

    const { id: announcementId } = await params
    const userId = token.sub

    // Проверяем, существует ли объявление
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    })

    if (!announcement) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    }

    // Проверяем, существует ли уже лайк
    const existingLike = await prisma.announcementLike.findUnique({
      where: {
        userId_announcementId: {
          userId,
          announcementId,
        },
      },
    })

    if (existingLike) {
      // Если лайк уже существует, удаляем его
      await prisma.$transaction([
        prisma.announcementLike.delete({
          where: {
            userId_announcementId: {
              userId,
              announcementId,
            },
          },
        }),
        prisma.announcement.update({
          where: { id: announcementId },
          data: {
            likes: { decrement: 1 },
          },
        }),
      ])

      return NextResponse.json({ 
        message: "Лайк удален", 
        liked: false,
        likesCount: announcement.likes - 1
      }, { status: 200 })
    } else {
      // Если лайка нет, создаем его
      await prisma.$transaction([
        prisma.announcementLike.create({
          data: {
            userId,
            announcementId,
          },
        }),
        prisma.announcement.update({
          where: { id: announcementId },
          data: {
            likes: { increment: 1 },
          },
        }),
      ])

      return NextResponse.json({ 
        message: "Лайк добавлен", 
        liked: true,
        likesCount: announcement.likes + 1
      }, { status: 200 })
    }
  } catch (error) {
    console.error("Ошибка при обработке лайка: ", error)
    return NextResponse.json({ error: "Ошибка при обработке лайка" }, { status: 500 })
  }
}

// DELETE /api/announcements/[id]/like - Удаление лайка
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
    }

    const { id: announcementId } = await params
    const userId = token.sub

    // Проверяем, существует ли лайк
    const existingLike = await prisma.announcementLike.findUnique({
      where: {
        userId_announcementId: {
          userId,
          announcementId,
        },
      },
    })

    if (!existingLike) {
      return NextResponse.json({ error: "Вы не ставили лайк этому объявлению" }, { status: 400 })
    }

    // Удаление лайка
    await prisma.$transaction([
      prisma.announcementLike.delete({
        where: {
          userId_announcementId: {
            userId,
            announcementId,
          },
        },
      }),
      prisma.announcement.update({
        where: { id: announcementId },
        data: {
          likes: { decrement: 1 },
        },
      }),
    ])

    return NextResponse.json({ message: "Лайк успешно удален" }, { status: 200 })
  } catch (error) {
    console.error("Ошибка при удалении лайка:", error)
    return NextResponse.json({ error: "Ошибка при удалении лайка" }, { status: 500 })
  }
}