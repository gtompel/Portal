import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

// Кеширование для overview
let overviewCache: any = null
let overviewCacheTimestamp = 0
const OVERVIEW_CACHE_DURATION = 5 * 60 * 1000 // 5 минут

export async function GET(request: Request) {
  try {
    // Проверяем аутентификацию
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Проверяем кеш
    const now = Date.now()
    if (overviewCache && (now - overviewCacheTimestamp) < OVERVIEW_CACHE_DURATION) {
      return NextResponse.json(overviewCache)
    }

    // Получаем данные о задачах за последние 6 месяцев
    const currentDate = new Date()
    const sixMonthsAgo = new Date(currentDate)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Получаем статистику по задачам по месяцам
    const tasksByMonth = await prisma.$queryRaw`
      SELECT 
        to_char(date_trunc('month', "createdAt"), 'Mon') as month,
        COUNT(CASE WHEN "status" = 'NEW' THEN 1 END) as new_tasks,
        COUNT(CASE WHEN "status" = 'COMPLETED' THEN 1 END) as completed_tasks
      FROM "Task"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY date_trunc('month', "createdAt")
      ORDER BY date_trunc('month', "createdAt") ASC
      LIMIT 6
    `

    // Преобразуем данные для графика
    const taskData = Array.isArray(tasksByMonth)
      ? tasksByMonth.map((item: any) => ({
          name: item.month,
          новые: Number(item.new_tasks) || 0,
          выполненные: Number(item.completed_tasks) || 0,
        }))
      : []

    // Получаем статистику по статусам задач
    const taskStatusCounts = await prisma.task.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    })

    // Преобразуем данные для графика
    const statusColors = {
      NEW: "#3b82f6",
      IN_PROGRESS: "#eab308",
      REVIEW: "#a855f7",
      COMPLETED: "#22c55e",
    }

    const statusLabels = {
      NEW: "Новые",
      IN_PROGRESS: "В работе",
              REVIEW: "Готов",
      COMPLETED: "Завершенные",
    }

    const statusData = taskStatusCounts.map((status) => ({
      name: statusLabels[status.status as keyof typeof statusLabels] || status.status,
      value: status._count.status,
      color: statusColors[status.status as keyof typeof statusColors] || "#94a3b8",
    }))

    // Получаем статистику по типам документов
    const documentTypeCounts = await prisma.document.groupBy({
      by: ["type"],
      _count: {
        type: true,
      },
    })

    // Преобразуем данные для графика
    const documentColors = {
      DOC: "#3b82f6",
      SPREADSHEET: "#22c55e",
      PRESENTATION: "#f97316",
      IMAGE: "#a855f7",
      PDF: "#ef4444",
      OTHER: "#94a3b8",
    }

    const documentLabels = {
      DOC: "Документы",
      SPREADSHEET: "Таблицы",
      PRESENTATION: "Презентации",
      IMAGE: "Изображения",
      PDF: "PDF",
      OTHER: "Другие",
    }

    const documentData = documentTypeCounts.map((doc) => ({
      name: documentLabels[doc.type as keyof typeof documentLabels] || doc.type,
      value: doc._count.type,
      color: documentColors[doc.type as keyof typeof documentColors] || "#94a3b8",
    }))

    const result = {
      taskData,
      statusData,
      documentData,
    }

    // Обновляем кеш
    overviewCache = result
    overviewCacheTimestamp = now

    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error("Ошибка при получении данных обзора:", error)
    return NextResponse.json({ error: "Ошибка при получении данных обзора" }, { status: 500 })
  }
}

