import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/documents/[id] - Получить документ по ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
            email: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: "Документ не найден" }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Ошибка при получении документа:", error)
    return NextResponse.json({ error: "Ошибка при получении документа" }, { status: 500 })
  }
}

// PUT /api/documents/[id] - Обновить документ
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // Проверяем, существует ли документ
    const existingDocument = await prisma.document.findUnique({
      where: { id: params.id },
    })

    if (!existingDocument) {
      return NextResponse.json({ error: "Документ не найден" }, { status: 404 })
    }

    // Подготавливаем данные для обновления
    const updateData: any = {}

    // Обновляем только предоставленные поля
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) updateData.type = body.type
    if (body.url !== undefined) updateData.url = body.url
    if (body.size !== undefined) updateData.size = body.size

    // Обновляем документ
    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
      },
    })

    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error("Ошибка при обновлении документа:", error)
    return NextResponse.json({ error: "Ошибка при обновлении документа" }, { status: 500 })
  }
}

// DELETE /api/documents/[id] - Удалить документ
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Проверяем, существует ли документ
    const existingDocument = await prisma.document.findUnique({
      where: { id: params.id },
    })

    if (!existingDocument) {
      return NextResponse.json({ error: "Документ не найден" }, { status: 404 })
    }

    // Удаляем документ
    await prisma.document.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Документ успешно удален" })
  } catch (error) {
    console.error("Ошибка при удалении документа:", error)
    return NextResponse.json({ error: "Ошибка при удалении документа" }, { status: 500 })
  }
}

