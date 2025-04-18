import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/projects - Получить все проекты
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const userId = searchParams.get("userId")

    const whereClause: any = {}

    if (status && status !== "all") {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Если указан userId, ищем проекты, в которых пользователь является участником
    if (userId) {
      whereClause.members = {
        some: {
          userId: userId,
        },
      }
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                initials: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Ошибка при получении проектов:", error)
    return NextResponse.json({ error: "Ошибка при получении проектов" }, { status: 500 })
  }
}

// POST /api/projects - Создать новый проект
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Проверка обязательных полей
    if (!body.name || !body.startDate) {
      return NextResponse.json({ error: "Название и дата начала обязательны" }, { status: 400 })
    }

    // Создание проекта
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description || null,
        status: body.status || "ACTIVE",
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        members: {
          create:
            body.members?.map((member: any) => ({
              userId: member.userId,
              role: member.role,
            })) || [],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                initials: true,
                position: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании проекта:", error)
    return NextResponse.json({ error: "Ошибка при создании проекта" }, { status: 500 })
  }
}

