import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "ID объявления не указан" }, { status: 400 })
    }

    // Получаем объявление с информацией об авторе
    const announcement = await prisma.announcement.findUnique({
      where: { id },
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

    if (!announcement) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    }

    return NextResponse.json(announcement)
  } catch (error) {
    console.error("Ошибка при получении объявления:", error)
    return NextResponse.json({ error: "Ошибка при получении объявления" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "ID объявления не указан" }, { status: 400 })
    }

    const { title, content, category } = await request.json()

    // Проверяем, существует ли объявление
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    })

    if (!announcement) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    }

    // Обновляем объявление
    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        category,
      },
    })

    return NextResponse.json(updatedAnnouncement)
  } catch (error) {
    console.error("Ошибка при обновлении объявления:", error)
    return NextResponse.json({ error: "Ошибка при обновлении объявления" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "ID объявления не указан" }, { status: 400 })
    }

    // Проверяем, существует ли объявление
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    })

    if (!announcement) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 })
    }

    // Удаляем объявление
    await prisma.announcement.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Ошибка при удалении объявления:", error)
    return NextResponse.json({ error: "Ошибка при удалении объявления" }, { status: 500 })
  }
}

