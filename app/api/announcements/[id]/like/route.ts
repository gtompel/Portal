import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // Получаем текущую сессию пользователя
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 })
    }

    // Убедимся, что params.id доступен
    if (!params?.id) {
      return NextResponse.json({ error: "ID объявления не указан" }, { status: 400 })
    }

    const id = params.id
    const userId = session.user.id

    // Проверяем, существует ли объявление
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    })

    if (!announcement) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    }

    // Проверяем, не ставил ли пользователь уже лайк
    const existingLike = await prisma.announcementLike.findUnique({
      where: {
        userId_announcementId: {
          userId,
          announcementId: id,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json({ error: "Вы уже поставили лайк этому объявлению" }, { status: 400 })
    }

    // Создаем запись о лайке и увеличиваем счетчик
    const [like, updatedAnnouncement] = await prisma.$transaction([
      prisma.announcementLike.create({
        data: {
          userId,
          announcementId: id,
        },
      }),
      prisma.announcement.update({
        where: { id },
        data: {
          likes: { increment: 1 },
        },
      }),
    ])

    return NextResponse.json(updatedAnnouncement)
  } catch (error) {
    console.error("Ошибка при обновлении лайков:", error)
    return NextResponse.json({ error: "Ошибка при обновлении лайков" }, { status: 500 })
  }
}

