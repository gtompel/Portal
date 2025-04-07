import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// POST /api/announcements/[id]/comments/[commentId]/like - Лайк комментария
export async function POST(request: Request, { params }: { params: { id: string; commentId: string } }) {
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

    // Проверяем, существует ли комментарий
    const comment = await prisma.comment.findUnique({
      where: {
        id: commentId,
        announcementId,
      },
    })

    if (!comment) {
      return NextResponse.json({ error: "Комментарий не найден" }, { status: 404 })
    }

    // Проверяем, не лайкнул ли пользователь уже этот комментарий
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json({ error: "Вы уже лайкнули этот комментарий" }, { status: 400 })
    }

    // Создаем лайк
    await prisma.commentLike.create({
      data: {
        userId: session.user.id,
        commentId,
      },
    })

    // Обновляем счетчик лайков в комментарии
    const updatedComment = await prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        likesCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ likesCount: updatedComment.likesCount })
  } catch (error) {
    console.error("Ошибка при лайке комментария:", error)
    return NextResponse.json({ error: "Ошибка при лайке комментария" }, { status: 500 })
  }
}

// DELETE /api/announcements/[id]/comments/[commentId]/like - Удаление лайка комментария
export async function DELETE(request: Request, { params }: { params: { id: string; commentId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
    }

    if (!params?.id || !params?.commentId) {
      return NextResponse.json({ error: "ID объявления или комментария не указан" }, { status: 400 })
    }

    const commentId = params.commentId

    // Проверяем, лайкнул ли пользователь этот комментарий
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId,
        },
      },
    })

    if (!existingLike) {
      return NextResponse.json({ error: "Вы не лайкали этот комментарий" }, { status: 400 })
    }

    // Удаляем лайк
    await prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId,
        },
      },
    })

    // Обновляем счетчик лайков в комментарии
    const updatedComment = await prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        likesCount: {
          decrement: 1,
        },
      },
    })

    return NextResponse.json({ likesCount: updatedComment.likesCount })
  } catch (error) {
    console.error("Ошибка при удалении лайка комментария:", error)
    return NextResponse.json({ error: "Ошибка при удалении лайка комментария" }, { status: 500 })
  }
}

