import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getToken } from "next-auth/jwt"

// POST /api/announcements/[id]/comments/[commentId]/like - Лайк комментария
export async function POST(
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
          userId: token.sub,
          commentId,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json({ error: "Вы уже лайкнули этот комментарий" }, { status: 400 })
    }

    // Создаем лайк и обновляем счетчик лайков в комментарии
    const [like, updatedComment] = await prisma.$transaction([
      prisma.commentLike.create({
        data: {
          userId: token.sub,
          commentId,
        },
      }),
      prisma.comment.update({
        where: {
          id: commentId,
        },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      }),
    ])

    return NextResponse.json({ likesCount: updatedComment.likesCount })
  } catch (error) {
    console.error("Ошибка при лайке комментария:", error)
    return NextResponse.json({ error: "Ошибка при лайке комментария" }, { status: 500 })
  }
}

// DELETE /api/announcements/[id]/comments/[commentId]/like - Удаление лайка комментария
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

    // Проверяем, лайкнул ли пользователь этот комментарий
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: token.sub,
          commentId,
        },
      },
    })

    if (!existingLike) {
      return NextResponse.json({ error: "Вы не лайкали этот комментарий" }, { status: 400 })
    }

    // Удаляем лайк и обновляем счетчик лайков в комментарии
    const [deletedLike, updatedComment] = await prisma.$transaction([
      prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId: token.sub,
            commentId,
          },
        },
      }),
      prisma.comment.update({
        where: {
          id: commentId,
        },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      }),
    ])

    return NextResponse.json({ likesCount: updatedComment.likesCount })
  } catch (error) {
    console.error("Ошибка при удалении лайка комментария:", error)
    return NextResponse.json({ error: "Ошибка при удалении лайка комментария" }, { status: 500 })
  }
}

