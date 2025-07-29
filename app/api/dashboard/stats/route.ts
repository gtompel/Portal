import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

// Простое кеширование в памяти (в продакшене лучше использовать Redis)
let statsCache: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 минут

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
    if (statsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(statsCache)
    }

    // Получаем текущую дату и дату неделю назад
    const currentDate = new Date()
    const oneWeekAgo = new Date(currentDate)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Выполняем все запросы в одной транзакции для оптимизации
    const [
      totalTasks,
      totalTasksLastWeek,
      activeTasks,
      activeTasksLastWeek,
      totalDocuments,
      totalDocumentsLastWeek,
      totalAnnouncements,
      totalAnnouncementsLastWeek
    ] = await prisma.$transaction([
      // Задачи
      prisma.task.count(),
      prisma.task.count({
        where: { createdAt: { lt: oneWeekAgo } }
      }),
      prisma.task.count({
        where: { status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] } }
      }),
      prisma.task.count({
        where: { 
          status: { in: ["NEW", "IN_PROGRESS", "REVIEW"] },
          createdAt: { lt: oneWeekAgo }
        }
      }),
      // Документы
      prisma.document.count(),
      prisma.document.count({
        where: { createdAt: { lt: oneWeekAgo } }
      }),
      // Объявления
      prisma.announcement.count(),
      prisma.announcement.count({
        where: { createdAt: { lt: oneWeekAgo } }
      })
    ])

    const result = {
      tasks: {
        total: totalTasks,
        active: activeTasks,
        totalDiff: totalTasks - totalTasksLastWeek,
        activeDiff: activeTasks - activeTasksLastWeek,
      },
      documents: {
        total: totalDocuments,
        diff: totalDocuments - totalDocumentsLastWeek,
      },
      announcements: {
        total: totalAnnouncements,
        diff: totalAnnouncements - totalAnnouncementsLastWeek,
      },
    }

    // Обновляем кеш
    statsCache = result
    cacheTimestamp = now

    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error("Ошибка при получении статистики:", error)
    return NextResponse.json({ error: "Ошибка при получении статистики" }, { status: 500 })
  }
}

