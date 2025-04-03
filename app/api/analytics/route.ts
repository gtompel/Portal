import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/analytics - Получить аналитические данные
export async function GET(request: NextRequest) {
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

    // Получаем статистику по задачам
    const taskStats = await prisma.task.groupBy({
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

    // Получаем статистику по документам
    const documentStats = await prisma.document.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    // Получаем статистику по проектам
    const projectStats = await prisma.project.groupBy({
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

    // Получаем статистику по сотрудникам
    const employeeStats = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    // Формируем общую статистику
    const stats = {
      tasks: {
        total: taskStats.reduce((acc, curr) => acc + curr._count.id, 0),
        byStatus: taskStats.reduce(
          (acc, curr) => {
            acc[curr.status.toLowerCase()] = curr._count.id
            return acc
          },
          {} as Record<string, number>,
        ),
      },
      documents: {
        total: documentStats.reduce((acc, curr) => acc + curr._count.id, 0),
        byType: documentStats.reduce(
          (acc, curr) => {
            acc[curr.type.toLowerCase()] = curr._count.id
            return acc
          },
          {} as Record<string, number>,
        ),
      },
      projects: {
        total: projectStats.reduce((acc, curr) => acc + curr._count.id, 0),
        byStatus: projectStats.reduce(
          (acc, curr) => {
            acc[curr.status.toLowerCase()] = curr._count.id
            return acc
          },
          {} as Record<string, number>,
        ),
      },
      employees: {
        total: employeeStats,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Ошибка при получении аналитических данных:", error)
    return NextResponse.json({ error: "Ошибка при получении аналитических данных" }, { status: 500 })
  }
}

