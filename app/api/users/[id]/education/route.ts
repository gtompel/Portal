import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/users/[id]/education - Получить образование пользователя
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const education = await prisma.education.findMany({
      where: { userId: id },
      orderBy: { year: "desc" },
    })

    return NextResponse.json(education)
  } catch (error) {
    console.error("Ошибка при получении образования:", error)
    return NextResponse.json({ error: "Ошибка при получении образования" }, { status: 500 })
  }
}

// POST /api/users/[id]/education - Добавить образование
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    // Проверка обязательных полей
    if (!body.degree || !body.institution || !body.year) {
      return NextResponse.json({ error: "Все поля обязательны для заполнения" }, { status: 400 })
    }

    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Создаем запись об образовании
    const education = await prisma.education.create({
      data: {
        degree: body.degree,
        institution: body.institution,
        year: body.year,
        userId: id,
      },
    })

    return NextResponse.json(education, { status: 201 })
  } catch (error) {
    console.error("Ошибка при добавлении образования:", error)
    return NextResponse.json({ error: "Ошибка при добавлении образования" }, { status: 500 })
  }
}

