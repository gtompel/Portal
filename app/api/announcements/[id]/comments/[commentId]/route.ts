import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET /api/announcements/[id]/comments/[commentId] - Получение комментария
export async function GET(request: Request, { params }: { params: { id: string; commentId: string } }) {
  try {
    if (!params?.id || !params?.commentId) {
      return NextResponse.json({ error: "ID объявления или комментария не указан" }, { status: 400 })
    }

    const announcementId = params.id
    const commentId = params.commentId

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
export async function PUT(request: Request, { params }: { params: { id: string; commentId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
    }

    if (!params?.id || !params?.commentId) {
      return NextResponse.json({ error: "ID объявления или комментария не указан" }, { status: 400 })
    }

    const announcementId = params.id
    const commentId = params.commentId
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

    if (comment.authorId !== session.user.id) {
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
            image: true,
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
export async function DELETE(request: Request, { params }: { params: { id: string; commentId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
    }

    if (!params?.id || !params?.commentId) {
      return NextResponse.json({ error: "ID объявления или комментария не указан" }, { status: 400 })
    }

    const announcementId = params.id
    const commentId = params.commentId

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

    if (comment.authorId !== session.user.id) {
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

    // Удаляем комментарий
    await prisma.comment.delete({
      where: {
        id: commentId,
      },
    })

    return NextResponse.json({ message: "Комментарий успешно удален" })
  } catch (error) {
    console.error("Ошибка при удалении комментария:", error)
    return NextResponse.json({ error: "Ошибка при удалении комментария" }, { status: 500 })
  }
}

