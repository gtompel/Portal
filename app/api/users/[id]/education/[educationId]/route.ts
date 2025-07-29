import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// PUT /api/users/[id]/education/[educationId] - Обновить образование
export async function PUT(request: NextRequest, { params }: { params: { id: string; educationId: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const { id, educationId } = params
    const body = await request.json()

    // Проверка обязательных полей
    if (!body.degree || !body.institution || !body.year) {
      return NextResponse.json({ error: "Все поля обязательны для заполнения" }, { status: 400 })
    }

    // Проверяем, существует ли запись об образовании
    const existingEducation = await prisma.education.findUnique({
      where: { id: educationId },
    })

    if (!existingEducation) {
      return NextResponse.json({ error: "Запись об образовании не найдена" }, { status: 404 })
    }

    // Проверяем, принадлежит ли запись указанному пользователю
    if (existingEducation.userId !== id) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    // Обновляем запись об образовании
    const updatedEducation = await prisma.education.update({
      where: { id: educationId },
      data: {
        degree: body.degree,
        institution: body.institution,
        year: body.year,
      },
    })

    return NextResponse.json(updatedEducation)
  } catch (error) {
    console.error("Ошибка при обновлении образования:", error)
    return NextResponse.json({ error: "Ошибка при обновлении образования" }, { status: 500 })
  }
}

// DELETE /api/users/[id]/education/[educationId] - Удалить образование
export async function DELETE(request: NextRequest, { params }: { params: { id: string; educationId: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const { id, educationId } = params

    // Проверяем, существует ли запись об образовании
    const existingEducation = await prisma.education.findUnique({
      where: { id: educationId },
    })

    if (!existingEducation) {
      return NextResponse.json({ error: "Запись об образовании не найдена" }, { status: 404 })
    }

    // Проверяем, принадлежит ли запись указанному пользователю
    if (existingEducation.userId !== id) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    // Удаляем запись об образовании
    await prisma.education.delete({
      where: { id: educationId },
    })

    return NextResponse.json({ message: "Запись об образовании успешно удалена" })
  } catch (error) {
    console.error("Ошибка при удалении образования:", error)
    return NextResponse.json({ error: "Ошибка при удалении образования" }, { status: 500 })
  }
}

