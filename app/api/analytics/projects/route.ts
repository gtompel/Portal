import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// Функция для преобразования BigInt в числа
function serializeBigInt(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === "bigint") {
    return Number(data)
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeBigInt(item))
  }

  if (typeof data === "object") {
    const result: any = {}
    for (const key in data) {
      result[key] = serializeBigInt(data[key])
    }
    return result
  }

  return data
}

// GET /api/analytics/projects - Получить данные о проектах и задачах
export async function GET(request: NextRequest) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "year"

    // Определяем начальную дату для периода
    const startDate = new Date()
    if (period === "month") {
      startDate.setMonth(startDate.getMonth() - 1)
    } else if (period === "quarter") {
      startDate.setMonth(startDate.getMonth() - 3)
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - 1)
    }

    // Получаем статистику по статусам задач
    const taskStatusStats = await prisma.task.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    // Получаем статистику по приоритетам задач
    const taskPriorityStats = await prisma.task.groupBy({
      by: ["priority"],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    // Получаем задачи с ближайшими сроками
    const upcomingTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: new Date(),
        },
        status: {
          not: "COMPLETED",
        },
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 5,
    })

    // Формируем данные о проектах и задачах
    const projectsData = {
      taskStatusStats: taskStatusStats.map((stat) => ({
        status: stat.status,
        count: stat._count.id,
      })),
      taskPriorityStats: taskPriorityStats.map((stat) => ({
        priority: stat.priority,
        count: stat._count.id,
      })),
      upcomingTasks: upcomingTasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee: task.assignee
          ? {
              id: task.assignee.id,
              name: task.assignee.name,
              avatar: task.assignee.avatar,
              initials: task.assignee.initials,
            }
          : null,
      })),
    }

    return NextResponse.json(serializeBigInt(projectsData))
  } catch (error) {
    console.error("Ошибка при получении данных о проектах:", error)
    return NextResponse.json({ error: "Ошибка при получении данных о проектах" }, { status: 500 })
  }
}

