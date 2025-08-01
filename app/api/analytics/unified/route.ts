import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

// Кеширование для аналитики
let analyticsCache: any = null
let analyticsCacheTimestamp = 0
const ANALYTICS_CACHE_DURATION = 5 * 60 * 1000 // 5 минут

export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month"

    // Проверяем кеш
    const now = Date.now()
    if (analyticsCache && (now - analyticsCacheTimestamp) < ANALYTICS_CACHE_DURATION) {
      return NextResponse.json(analyticsCache)
    }

    // Определяем даты для фильтрации
    const currentDate = new Date()
    const startDate = new Date(currentDate)

    if (period === "week") {
      startDate.setDate(currentDate.getDate() - 7)
    } else if (period === "month") {
      startDate.setMonth(currentDate.getMonth() - 1)
    } else if (period === "quarter") {
      startDate.setMonth(currentDate.getMonth() - 3)
    } else if (period === "year") {
      startDate.setFullYear(currentDate.getFullYear() - 1)
    }

    // Получаем все данные в одной транзакции для оптимизации
    const [
      tasks,
      documents,
      announcements,
      users,
      taskStats,
      taskStatusStats,
      taskPriorityStats,
      taskNetworkStats,
      tasksByAssignee,
      tasksOverTime,
      overdueTasks,
      upcomingTasks
    ] = await prisma.$transaction([
      // Все задачи за период
      prisma.task.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          networkType: true,
          dueDate: true,
          createdAt: true,
          assignee: {
            select: {
              id: true,
              name: true,
              avatar: true,
              initials: true
            }
          }
        }
      }),
      // Все документы (без фильтра по дате)
      prisma.document.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 100, // Ограничиваем количество документов для аналитики
      }),
      // Все объявления за период
      prisma.announcement.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          title: true,
          category: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 100, // Ограничиваем количество результатов для аналитики
      }),
      // Все пользователи
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          avatar: true,
          initials: true,
          position: true,
          department: true,
        },
        take: 1000, // Ограничиваем количество пользователей для аналитики
      }),
      // Статистика по задачам
      prisma.task.groupBy({
        by: ["status"],
        _count: { id: true },
        where: { createdAt: { gte: startDate } }
      }),
      // Статистика по статусам
      prisma.task.groupBy({
        by: ["status"],
        _count: { id: true },
        where: { createdAt: { gte: startDate } }
      }),
      // Статистика по приоритетам
      prisma.task.groupBy({
        by: ["priority"],
        _count: { id: true },
        where: { createdAt: { gte: startDate } }
      }),
      // Статистика по типам сети
      prisma.task.groupBy({
        by: ["networkType"],
        _count: { id: true },
        where: { createdAt: { gte: startDate } }
      }),
      // Задачи по исполнителям
      prisma.task.groupBy({
        by: ["assigneeId"],
        _count: { id: true },
        where: { 
          createdAt: { gte: startDate },
          assigneeId: { not: null }
        }
      }),
      // Задачи по времени (последние 30 дней)
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*) as created,
          COUNT(CASE WHEN "status" = 'COMPLETED' THEN 1 END) as completed
        FROM "Task"
        WHERE "createdAt" >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      // Просроченные задачи
      prisma.task.findMany({
        where: {
          status: { not: "COMPLETED" },
          dueDate: { lt: currentDate },
          dueDate: { not: null }
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: {
            select: {
              id: true,
              name: true,
              avatar: true,
              initials: true
            }
          }
        }
      }),
      // Ближайшие задачи
      prisma.task.findMany({
        where: {
          status: { not: "COMPLETED" },
          dueDate: { 
            gte: currentDate,
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Следующие 7 дней
          }
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assignee: {
            select: {
              id: true,
              name: true,
              avatar: true,
              initials: true
            }
          }
        },
        orderBy: { dueDate: "asc" },
        take: 10
      })
    ])

    // Формируем общую статистику
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === "COMPLETED").length
    const inProgressTasks = tasks.filter(task => 
      task.status === "IN_PROGRESS" || task.status === "REVIEW"
    ).length
    const newTasks = tasks.filter(task => task.status === "NEW").length

    // Статистика по статусам
    const tasksByStatus = taskStatusStats.map(stat => ({
      name: getStatusText(stat.status),
      value: stat._count.id,
      color: getStatusColor(stat.status)
    }))

    // Статистика по приоритетам
    const tasksByPriority = taskPriorityStats.map(stat => ({
      name: getPriorityText(stat.priority),
      value: stat._count.id,
      color: getPriorityColor(stat.priority)
    }))

    // Статистика по типам сети
    const tasksByNetwork = taskNetworkStats.map(stat => ({
      name: getNetworkTypeText(stat.networkType),
      value: stat._count.id,
      color: getNetworkTypeColor(stat.networkType)
    }))

    // Статистика по исполнителям - показываем всех пользователей
    const tasksByAssigneeData = users.map(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id)
      const userOverdueTasks = overdueTasks.filter(t => t.assigneeId === user.id)
      
      return {
        name: getDisplayName(user.name),
        fullName: user.name, // сохраняем полное имя для tooltip
        completed: userTasks.filter(t => t.status === "COMPLETED").length,
        inProgress: userTasks.filter(t => 
          t.status === "IN_PROGRESS" || t.status === "REVIEW"
        ).length,
        overdue: userOverdueTasks.length,
        total: userTasks.length
      }
    })

    // Данные по времени
    const tasksOverTimeData = Array.isArray(tasksOverTime) 
      ? tasksOverTime.map((item: any) => ({
          date: item.date,
          created: Number(item.created) || 0,
          completed: Number(item.completed) || 0
        }))
      : []

    // Производительность (выполненные задачи / общее количество)
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Среднее время выполнения (для завершенных задач с dueDate)
    const completedWithDueDate = tasks.filter(t => 
      t.status === "COMPLETED" && t.dueDate
    )
    let averageCompletionTime = 0
    if (completedWithDueDate.length > 0) {
      const totalTime = completedWithDueDate.reduce((acc, task) => {
        const created = new Date(task.createdAt)
        const completed = new Date(task.updatedAt)
        return acc + (completed.getTime() - created.getTime())
      }, 0)
      averageCompletionTime = Math.round(totalTime / completedWithDueDate.length / (1000 * 60 * 60 * 24)) // в днях
    }

    const result = {
      // Общая статистика
      overview: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          new: newTasks,
          overdue: overdueTasks.length,
          completionRate: Math.round(completionRate * 100) / 100,
          averageCompletionTime
        },
        documents: {
          total: documents.length,
          byType: documents.reduce((acc, doc) => {
            acc[doc.type] = (acc[doc.type] || 0) + 1
            return acc
          }, {} as Record<string, number>)
        },
        announcements: {
          total: announcements.length
        },
        users: {
          total: users.length
        }
      },
      // Детальная статистика
      details: {
        tasksByStatus,
        tasksByPriority,
        tasksByNetwork,
        tasksByAssignee: tasksByAssigneeData,
        tasksOverTime: tasksOverTimeData
      },
      // Актуальные данные
      current: {
        overdueTasks: overdueTasks.slice(0, 5).map(task => ({
          ...task,
          assignee: task.assignee ? {
            ...task.assignee,
            displayName: getDisplayName(task.assignee.name)
          } : undefined
        })),
        upcomingTasks: upcomingTasks.slice(0, 5).map(task => ({
          ...task,
          assignee: task.assignee ? {
            ...task.assignee,
            displayName: getDisplayName(task.assignee.name)
          } : undefined
        }))
      }
    }

    // Обновляем кеш
    analyticsCache = result
    analyticsCacheTimestamp = now

    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error("Ошибка при получении аналитических данных:", error)
    return NextResponse.json(
      { error: "Ошибка при получении аналитических данных" }, 
      { status: 500 }
    )
  }
}

// Вспомогательные функции для цветов и текста
function getStatusText(status: string): string {
  switch (status) {
    case "NEW": return "Новый"
    case "IN_PROGRESS": return "Идёт настройка"
    case "REVIEW": return "Готов"
    case "COMPLETED": return "Выдан"
    default: return status
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "NEW": return "#3B82F6"
    case "IN_PROGRESS": return "#F59E0B"
    case "REVIEW": return "#8B5CF6"
    case "COMPLETED": return "#10B981"
    default: return "#6B7280"
  }
}

function getPriorityText(priority: string): string {
  switch (priority) {
    case "HIGH": return "СЗ"
    case "MEDIUM": return "Без СЗ"
    case "LOW": return "Поручение"
    default: return priority
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "HIGH": return "#EF4444"
    case "MEDIUM": return "#F59E0B"
    case "LOW": return "#10B981"
    default: return "#6B7280"
  }
}

function getNetworkTypeText(networkType: string): string {
  switch (networkType) {
    case "EMVS": return "ЕМВС"
    case "INTERNET": return "Интернет"
    case "ASZI": return "АСЗИ"
    default: return networkType
  }
}

function getNetworkTypeColor(networkType: string): string {
  switch (networkType) {
    case "EMVS": return "#3B82F6"
    case "INTERNET": return "#10B981"
    case "ASZI": return "#F59E0B"
    default: return "#6B7280"
  }
}

// Функция для отображения имени в компактном формате
function getDisplayName(fullName: string): string {
  const nameParts = fullName.trim().split(" ").filter(part => part.length > 0)
  
  // Если имя короткое, возвращаем как есть
  if (nameParts.length <= 2) {
    return fullName
  }
  
  // Для длинных имен: Фамилия И.О.
  if (nameParts.length >= 3) {
    const lastName = nameParts[0]
    const firstNameInitial = nameParts[1].charAt(0) + "."
    const middleNameInitial = nameParts[2].charAt(0) + "."
    return `${lastName} ${firstNameInitial}${middleNameInitial}`
  }
  
  return fullName
} 