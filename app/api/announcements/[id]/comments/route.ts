import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"

// GET /api/announcements/[id]/comments - Получение комментариев к объявлению
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: announcementId } = await params

    if (!announcementId) {
      return NextResponse.json({ error: "ID объявления не указан" }, { status: 400 })
    }

    // Проверяем, существует ли объявление
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    })

    if (!announcement) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    }

    // Получаем комментарии к объявлению
    const comments = await prisma.comment.findMany({
      where: {
        announcementId,
        parentId: null, // Только родительские комментарии
      },
      select: {
        id: true,
        content: true,
        likesCount: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        replies: {
          select: {
            id: true,
            content: true,
            likesCount: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                initials: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 50, // Ограничиваем количество ответов
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Ограничиваем количество комментариев для производительности
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Ошибка при получении комментариев:", error)
    return NextResponse.json({ error: "Ошибка при получении комментариев" }, { status: 500 })
  }
}

// POST /api/announcements/[id]/comments - Добавление комментария к объявлению
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

    if (!announcementId) {
      return NextResponse.json({ error: "ID объявления не указан" }, { status: 400 })
    }

    const { content, parentId } = await request.json()

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Содержание комментария не может быть пустым" }, { status: 400 })
    }

    // Проверяем, существует ли объявление
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    })

    if (!announcement) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    }

    // Если указан parentId, проверяем, существует ли родительский комментарий
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })

      if (!parentComment) {
        return NextResponse.json({ error: "Родительский комментарий не найден" }, { status: 404 })
      }
    }

    // Создаем комментарий и увеличиваем счетчик комментариев в объявлении
    const [comment, updatedAnnouncement] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content,
          authorId: token.sub,
          announcementId,
          parentId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
              initials: true,
            },
          },
        },
      }),
      prisma.announcement.update({
        where: { id: announcementId },
        data: {
          comments: { increment: 1 },
        },
      }),
    ])

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Ошибка при добавлении комментария:", error)
    return NextResponse.json({ error: "Ошибка при добавлении комментария" }, { status: 500 })
  }
}

