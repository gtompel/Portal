import { prisma } from "./prisma"

// Оптимизированные запросы с объединением операций

export class OptimizedQueries {
  // Получение дашборда с объединением всех данных
  static async getDashboardData(userId: string) {
    return await prisma.$transaction(async (tx) => {
      const [
        tasks,
        notifications,
        userStats,
        recentActivity
      ] = await Promise.all([
        // Задачи пользователя
        tx.task.findMany({
          where: { 
            OR: [
              { assigneeId: userId },
              { creatorId: userId }
            ],
            isArchived: false
          },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true,
            assignee: { select: { id: true, name: true, avatar: true } },
            creator: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 10
        }),
        
        // Уведомления пользователя
        tx.notification.findMany({
          where: { userId, read: false },
          select: {
            id: true,
            type: true,
            createdAt: true,
            task: { select: { id: true, title: true } },
            event: { select: { id: true, title: true } },
            message: { select: { id: true, content: true } },
            announcement: { select: { id: true, title: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 5
        }),
        
        // Статистика пользователя
        tx.$queryRaw<Array<{
          completed_tasks: number
          in_progress_tasks: number
          overdue_tasks: number
          total_tasks: number
        }>>`
          SELECT 
            COUNT(*) FILTER (WHERE "assigneeId" = ${userId} AND status = 'COMPLETED') as completed_tasks,
            COUNT(*) FILTER (WHERE "assigneeId" = ${userId} AND status IN ('IN_PROGRESS', 'REVIEW')) as in_progress_tasks,
            COUNT(*) FILTER (WHERE "assigneeId" = ${userId} AND "dueDate" < NOW() AND status != 'COMPLETED') as overdue_tasks,
            COUNT(*) FILTER (WHERE "assigneeId" = ${userId}) as total_tasks
          FROM "Task"
          WHERE "isArchived" = false
        `,
        
        // Последняя активность
        tx.$queryRaw`
          SELECT 
            'task' as type,
            t.id,
            t.title,
            t."createdAt",
            u.name as user_name
          FROM "Task" t
          LEFT JOIN "User" u ON t."creatorId" = u.id
          WHERE t."isArchived" = false
          UNION ALL
          SELECT 
            'announcement' as type,
            a.id,
            a.title,
            a."createdAt",
            u.name as user_name
          FROM "Announcement" a
          LEFT JOIN "User" u ON a."authorId" = u.id
          ORDER BY "createdAt" DESC
          LIMIT 10
        `
      ])

      return {
        tasks,
        notifications,
        userStats: userStats[0],
        recentActivity
      }
    })
  }

  // Получение аналитики с использованием materialized views
  static async getAnalytics(period: string = 'month') {
    const startDate = new Date()
    if (period === 'week') startDate.setDate(startDate.getDate() - 7)
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1)
    else if (period === 'quarter') startDate.setMonth(startDate.getMonth() - 3)
    else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1)

    return await prisma.$transaction(async (tx) => {
      const [
        taskStats,
        userStats,
        notificationStats,
        documentStats,
        timeStats
      ] = await Promise.all([
        // Используем materialized views для статистики
        tx.$queryRaw<Array<{
          completed_tasks: number
          in_progress_tasks: number
          new_tasks: number
          high_priority_tasks: number
        }>>`
          SELECT 
            (SELECT COUNT(*) FROM task_status_stats WHERE status = 'COMPLETED') as completed_tasks,
            (SELECT COUNT(*) FROM task_status_stats WHERE status IN ('IN_PROGRESS', 'REVIEW')) as in_progress_tasks,
            (SELECT COUNT(*) FROM task_status_stats WHERE status = 'NEW') as new_tasks,
            (SELECT COUNT(*) FROM task_priority_stats WHERE priority = 'HIGH') as high_priority_tasks
        `,
        
        // Статистика пользователей
        tx.$queryRaw`SELECT * FROM user_stats`,
        
        // Статистика уведомлений
        tx.$queryRaw`SELECT * FROM notification_stats`,
        
        // Статистика документов
        tx.$queryRaw`SELECT * FROM document_stats`,
        
        // Статистика по времени
        tx.$queryRaw`
          SELECT * FROM task_time_stats 
          WHERE date >= ${startDate.toISOString().split('T')[0]}
          ORDER BY date ASC
        `
      ])

      return {
        taskStats: taskStats[0],
        userStats,
        notificationStats,
        documentStats,
        timeStats
      }
    })
  }

  // Batch операции для уведомлений
  static async batchNotificationOperations(operations: Array<{
    action: 'create' | 'update' | 'delete'
    data?: any
    where?: any
  }>) {
    return await prisma.$transaction(async (tx) => {
      const results = []
      
      for (const op of operations) {
        switch (op.action) {
          case 'create':
            results.push(await tx.notification.create({ data: op.data }))
            break
          case 'update':
            results.push(await tx.notification.updateMany({ 
              where: op.where, 
              data: op.data 
            }))
            break
          case 'delete':
            results.push(await tx.notification.deleteMany({ where: op.where }))
            break
        }
      }
      
      return results
    })
  }

  // Оптимизированное получение задач с фильтрами
  static async getTasksOptimized(filters: {
    status?: string
    assigneeId?: string
    search?: string
    showArchived?: boolean
    limit?: number
  }) {
    const whereClause: any = {
      isArchived: filters.showArchived || false
    }

    if (filters.status && filters.status !== 'all') {
      whereClause.status = filters.status
    }

    if (filters.assigneeId) {
      whereClause.assigneeId = filters.assigneeId
    }

    if (filters.search) {
      whereClause.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    return await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        networkType: true,
        dueDate: true,
        taskNumber: true,
        createdAt: true,
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { taskNumber: 'desc' },
      take: filters.limit || 100
    })
  }
} 