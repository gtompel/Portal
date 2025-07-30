import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"

// GET /api/announcements/[id]/comments/[commentId] - Получение комментария
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: announcementId, commentId } = await params

    if (!announcementId || !commentId) {
      return NextResponse.json({ error: "ID объявления или комментария не указан" }, { status: 400 })
    }

    // Проверяем, существует ли комментарий
    const comment = await prisma.comment.findUnique({
      where: {
        id: commentId,
        announcementId,
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
        replies: {
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
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    if (!comment) {
      return NextResponse.json({ error: "Комментарий не найден" }, { status: 404 })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Ошибка при получении комментария:", error)
    return NextResponse.json({ error: "Ошибка при получении комментария" }, { status: 500 })
  }
}

// PUT /api/announcements/[id]/comments/[commentId] - Обновление комментария
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
    }

    const { id: announcementId, commentId } = await params

    if (!announcementId || !commentId) {
      return NextResponse.json({ error: "ID объявления или комментария не указан" }, { status: 400 })
    }

    const { content } = await request.json()

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Содержание комментария не может быть пустым" }, { status: 400 })
    }

    // Проверяем, существует ли комментарий и принадлежит ли он текущему пользователю
    const comment = await prisma.comment.findUnique({
      where: {
        id: commentId,
        announcementId,
      },
    })

    if (!comment) {
      return NextResponse.json({ error: "Комментарий не найден" }, { status: 404 })
    }

    if (comment.authorId !== token.sub) {
      return NextResponse.json({ error: "У вас нет прав на редактирование этого комментария" }, { status: 403 })
    }

    // Обновляем комментарий
    const updatedComment = await prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        content,
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
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error("Ошибка при обновлении комментария:", error)
    return NextResponse.json({ error: "Ошибка при обновлении комментария" }, { status: 500 })
  }
}

// DELETE /api/announcements/[id]/comments/[commentId] - Удаление комментария
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
    }

    const { id: announcementId, commentId } = await params

    if (!announcementId || !commentId) {
      return NextResponse.json({ error: "ID объявления или комментария не указан" }, { status: 400 })
    }

    // Проверяем, существует ли комментарий и принадлежит ли он текущему пользователю
    const comment = await prisma.comment.findUnique({
      where: {
        id: commentId,
        announcementId,
      },
    })

    if (!comment) {
      return NextResponse.json({ error: "Комментарий не найден" }, { status: 404 })
    }

    if (comment.authorId !== token.sub) {
      return NextResponse.json({ error: "У вас нет прав на удаление этого комментария" }, { status: 403 })
    }

    // Удаляем все ответы на комментарий
    if (!comment.parentId) {
      await prisma.comment.deleteMany({
        where: {
          parentId: commentId,
        },
      })
    }

    // Удаляем комментарий и уменьшаем счетчик комментариев в объявлении
    await prisma.$transaction([
      prisma.comment.delete({
        where: {
          id: commentId,
        },
      }),
      prisma.announcement.update({
        where: { id: announcementId },
        data: {
          comments: { decrement: 1 },
        },
      }),
    ])

    return NextResponse.json({ message: "Комментарий успешно удален" })
  } catch (error) {
    console.error("Ошибка при удалении комментария:", error)
    return NextResponse.json({ error: "Ошибка при удалении комментария" }, { status: 500 })
  }
}

