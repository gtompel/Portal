import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// PUT /api/users/[id]/experience/[experienceId] - Обновить опыт работы
export async function PUT(request: NextRequest, { params }: { params: { id: string; experienceId: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const { id, experienceId } = params
    const body = await request.json()

    // Проверка обязательных полей
    if (!body.position || !body.company || !body.period) {
      return NextResponse.json({ error: "Обязательные поля: должность, компания и период" }, { status: 400 })
    }

    // Проверяем, существует ли запись об опыте работы
    const existingExperience = await prisma.experience.findUnique({
      where: { id: experienceId },
    })

    if (!existingExperience) {
      return NextResponse.json({ error: "Запись об опыте работы не найдена" }, { status: 404 })
    }

    // Проверяем, принадлежит ли запись указанному пользователю
    if (existingExperience.userId !== id) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    // Обновляем запись об опыте работы
    const updatedExperience = await prisma.experience.update({
      where: { id: experienceId },
      data: {
        position: body.position,
        company: body.company,
        period: body.period,
        description: body.description || null,
      },
    })

    return NextResponse.json(updatedExperience)
  } catch (error) {
    console.error("Ошибка при обновлении опыта работы:", error)
    return NextResponse.json({ error: "Ошибка при обновлении опыта работы" }, { status: 500 })
  }
}

// DELETE /api/users/[id]/experience/[experienceId] - Удалить опыт работы
export async function DELETE(request: NextRequest, { params }: { params: { id: string; experienceId: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const { id, experienceId } = params

    // Проверяем, существует ли запись об опыте работы
    const existingExperience = await prisma.experience.findUnique({
      where: { id: experienceId },
    })

    if (!existingExperience) {
      return NextResponse.json({ error: "Запись об опыте работы не найдена" }, { status: 404 })
    }

    // Проверяем, принадлежит ли запись указанному пользователю
    if (existingExperience.userId !== id) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    // Удаляем запись об опыте работы
    await prisma.experience.delete({
      where: { id: experienceId },
    })

    return NextResponse.json({ message: "Запись об опыте работы успешно удалена" })
  } catch (error) {
    console.error("Ошибка при удалении опыта работы:", error)
    return NextResponse.json({ error: "Ошибка при удалении опыта работы" }, { status: 500 })
  }
}

