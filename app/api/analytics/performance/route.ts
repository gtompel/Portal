import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Добавим функцию для преобразования BigInt в числа
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

// GET /api/analytics/performance - Получить данные о производительности
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

    // Получаем данные о выполненных задачах по месяцам
    const tasksByMonth = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "createdAt") as date,
      to_char(DATE_TRUNC('month', "createdAt"), 'Mon') as month,
      COUNT(*) as tasks_count,
      COUNT(CASE WHEN "status" = 'COMPLETED' THEN 1 END) as completed_count
    FROM "Task"
    WHERE "createdAt" >= ${startDate}
    GROUP BY DATE_TRUNC('month', "createdAt"), to_char(DATE_TRUNC('month', "createdAt"), 'Mon')
    ORDER BY date ASC
  `

    // Получаем данные о производительности по отделам
    const departmentPerformance = await prisma.$queryRaw`
    SELECT 
      u."department",
      COUNT(t.id) as tasks_count,
      COUNT(CASE WHEN t."status" = 'COMPLETED' THEN 1 END) as completed_count,
      CASE 
        WHEN COUNT(t.id) > 0 
        THEN ROUND((COUNT(CASE WHEN t."status" = 'COMPLETED' THEN 1 END)::decimal / COUNT(t.id)) * 100)
        ELSE 0
      END as efficiency
    FROM "User" u
    LEFT JOIN "Task" t ON u.id = t."assigneeId" AND t."createdAt" >= ${startDate}
    WHERE u."department" IS NOT NULL
    GROUP BY u."department"
    ORDER BY efficiency DESC
  `

    // Получаем данные о производительности сотрудников
    const employeePerformance = await prisma.$queryRaw`
    SELECT 
      u.id,
      u.name,
      COUNT(t.id) as tasks_count,
      COUNT(CASE WHEN t."status" = 'COMPLETED' THEN 1 END) as completed_count,
      CASE 
        WHEN COUNT(t.id) > 0 
        THEN ROUND((COUNT(CASE WHEN t."status" = 'COMPLETED' THEN 1 END)::decimal / COUNT(t.id)) * 100)
        ELSE 0
      END as efficiency
    FROM "User" u
    LEFT JOIN "Task" t ON u.id = t."assigneeId" AND t."createdAt" >= ${startDate}
    GROUP BY u.id, u.name
    HAVING COUNT(t.id) > 0
    ORDER BY efficiency DESC
    LIMIT 10
  `

    // Формируем данные о производительности
    const performance = {
      tasksByMonth,
      departmentPerformance,
      employeePerformance,
    }

    return NextResponse.json(serializeBigInt(performance))
  } catch (error) {
    console.error("Ошибка при получении данных о производительности:", error)
    return NextResponse.json({ error: "Ошибка при получении данных о производительности" }, { status: 500 })
  }
}

