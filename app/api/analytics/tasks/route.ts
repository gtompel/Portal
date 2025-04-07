import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month"

    // Определяем даты для фильтрации
    const now = new Date()
    const startDate = new Date(now)

    if (period === "week") {
      startDate.setDate(now.getDate() - 7)
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1)
    } else if (period === "quarter") {
      startDate.setMonth(now.getMonth() - 3)
    } else {
      startDate.setMonth(now.getMonth() - 1) // По умолчанию месяц
    }

    // Получаем все задачи за выбранный период
    const tasks = await prisma.task.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        assignee: true,
      },
    })

    // Получаем статистику по задачам
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length
    const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS" || task.status === "REVIEW").length

    // Считаем просроченные задачи (задачи с dueDate в прошлом, которые не завершены)
    const overdueTasks = tasks.filter(
      (task) => task.status !== "COMPLETED" && task.dueDate && new Date(task.dueDate) < now,
    ).length

    // Рассчитываем среднее время выполнения задач
    const completedTasksWithDates = tasks.filter((task) => task.status === "COMPLETED" && task.dueDate)

    let averageCompletionTime = 0
    if (completedTasksWithDates.length > 0) {
      const totalDays = completedTasksWithDates.reduce((sum, task) => {
        const createdDate = new Date(task.createdAt)
        const dueDate = new Date(task.dueDate!)
        const diffTime = Math.abs(dueDate.getTime() - createdDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return sum + diffDays
      }, 0)
      averageCompletionTime = totalDays / completedTasksWithDates.length
    }

    // Формируем данные по статусам задач
    const statusColors = {
      NEW: "#94a3b8",
      IN_PROGRESS: "#3b82f6",
      REVIEW: "#eab308",
      COMPLETED: "#22c55e",
    }

    const statusLabels = {
      NEW: "Новые",
      IN_PROGRESS: "В работе",
      REVIEW: "На проверке",
      COMPLETED: "Завершенные",
    }

    const tasksByStatus = Object.entries(
      tasks.reduce(
        (acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    ).map(([status, count]) => ({
      name: statusLabels[status as keyof typeof statusLabels] || status,
      value: count,
      color: statusColors[status as keyof typeof statusColors] || "#94a3b8",
    }))

    // Формируем данные по приоритетам задач
    const priorityColors = {
      LOW: "#94a3b8",
      MEDIUM: "#3b82f6",
      HIGH: "#ef4444",
    }

    const priorityLabels = {
      LOW: "Низкий",
      MEDIUM: "Средний",
      HIGH: "Высокий",
    }

    const tasksByPriority = Object.entries(
      tasks.reduce(
        (acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
    ).map(([priority, count]) => ({
      name: priorityLabels[priority as keyof typeof priorityLabels] || priority,
      value: count,
      color: priorityColors[priority as keyof typeof priorityColors] || "#94a3b8",
    }))

    // Формируем данные по исполнителям
    const tasksByAssignee = Object.values(
      tasks.reduce(
        (acc, task) => {
          if (task.assigneeId) {
            if (!acc[task.assigneeId]) {
              acc[task.assigneeId] = {
                name: task.assignee?.name || "Неизвестный",
                completed: 0,
                inProgress: 0,
                overdue: 0,
              }
            }

            if (task.status === "COMPLETED") {
              acc[task.assigneeId].completed++
            } else if (task.status === "IN_PROGRESS" || task.status === "REVIEW") {
              acc[task.assigneeId].inProgress++
            }

            if (task.status !== "COMPLETED" && task.dueDate && new Date(task.dueDate) < now) {
              acc[task.assigneeId].overdue++
            }
          }
          return acc
        },
        {} as Record<string, TasksByAssignee>,
      ),
    ).sort((a, b) => b.completed + b.inProgress - (a.completed + a.inProgress))

    // Формируем данные по времени
    const tasksOverTime: TasksOverTime[] = []

    // Определяем шаг для группировки (день, неделя, месяц)
    const step = period === "week" ? 1 : period === "month" ? 3 : 7

    // Создаем массив дат для группировки
    const dates: Date[] = []
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + step)) {
      dates.push(new Date(d))
    }

    // Группируем задачи по датам
    for (let i = 0; i < dates.length; i++) {
      const currentDate = dates[i]
      const nextDate = i < dates.length - 1 ? dates[i + 1] : new Date(now.getTime() + 86400000)

      const created = tasks.filter(
        (task) => new Date(task.createdAt) >= currentDate && new Date(task.createdAt) < nextDate,
      ).length

      const completed = tasks.filter(
        (task) =>
          task.status === "COMPLETED" && new Date(task.updatedAt) >= currentDate && new Date(task.updatedAt) < nextDate,
      ).length

      tasksOverTime.push({
        date: currentDate.toISOString().split("T")[0],
        created,
        completed,
      })
    }

    // Формируем данные по проектам
    // В реальном приложении здесь был бы запрос к проектам
    const tasksByProject = [
      { name: "Корпоративный портал", value: 45 },
      { name: "Мобильное приложение", value: 30 },
      { name: "Аналитическая платформа", value: 25 },
      { name: "Интеграция CRM", value: 20 },
    ]

    return NextResponse.json({
      stats: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        averageCompletionTime,
      },
      tasksByStatus,
      tasksByPriority,
      tasksByProject,
      tasksOverTime,
      tasksByAssignee,
    })
  } catch (error) {
    console.error("Ошибка при получении данных:", error)
    return NextResponse.json({ error: "Ошибка при получении данных" }, { status: 500 })
  }
}

type TasksByAssignee = {
  name: string
  completed: number
  inProgress: number
  overdue: number
}

type TasksOverTime = {
  date: string
  created: number
  completed: number
}

