import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Проверяем, существует ли объявление
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    })

    if (!announcement) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    }

    // Увеличиваем количество лайков
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        likes: { increment: 1 },
      },
    })

    return NextResponse.json(updatedAnnouncement)
  } catch (error) {
    console.error("Ошибка при обновлении лайков:", error)
    return NextResponse.json({ error: "Ошибка при обновлении лайков" }, { status: 500 })
  }
}

