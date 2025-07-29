import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/users/[id]/experience - Получить опыт работы пользователя
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const id = params.id

    const experience = await prisma.experience.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(experience)
  } catch (error) {
    console.error("Ошибка при получении опыта работы:", error)
    return NextResponse.json({ error: "Ошибка при получении опыта работы" }, { status: 500 })
  }
}

// POST /api/users/[id]/experience - Добавить опыт работы
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const id = params.id
    const body = await request.json()

    // Проверка обязательных полей
    if (!body.position || !body.company || !body.period) {
      return NextResponse.json({ error: "Обязательные поля: должность, компания и период" }, { status: 400 })
    }

    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Создаем запись об опыте работы
    const experience = await prisma.experience.create({
      data: {
        position: body.position,
        company: body.company,
        period: body.period,
        description: body.description || null,
        userId: id,
      },
    })

    return NextResponse.json(experience, { status: 201 })
  } catch (error) {
    console.error("Ошибка при добавлении опыта работы:", error)
    return NextResponse.json({ error: "Ошибка при добавлении опыта работы" }, { status: 500 })
  }
}

