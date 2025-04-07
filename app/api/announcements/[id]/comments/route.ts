import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET /api/announcements/[id]/comments - Получение комментариев к объявлению
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!params?.id) {
      return NextResponse.json({ error: "ID объявления не указан" }, { status: 400 })
    }

    const announcementId = params.id

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
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Ошибка при получении комментариев:", error)
    return NextResponse.json({ error: "Ошибка при получении комментариев" }, { status: 500 })
  }
}

// POST /api/announcements/[id]/comments - Добавление комментария к объявлению
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
    }

    if (!params?.id) {
      return NextResponse.json({ error: "ID объявления не указан" }, { status: 400 })
    }

    const announcementId = params.id
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
          authorId: session.user.id,
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

