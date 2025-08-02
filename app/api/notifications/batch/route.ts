import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = token.sub
    const body = await request.json()
    const { action, notificationIds, markAll, lastSync } = body

    const result = await prisma.$transaction(async (tx) => {
      switch (action) {
        case "mark_read":
          if (markAll) {
            await tx.notification.updateMany({
              where: { userId, read: false },
              data: { read: true }
            })
            return { marked: "all" }
          } else if (notificationIds?.length) {
            await tx.notification.updateMany({
              where: { 
                id: { in: notificationIds },
                userId 
              },
              data: { read: true }
            })
            return { marked: notificationIds.length }
          }
          break

        case "sync":
          // Получаем уведомления с момента последней синхронизации
          const notifications = await tx.notification.findMany({
            where: {
              userId,
              createdAt: lastSync ? { gt: new Date(lastSync) } : undefined
            },
            select: {
              id: true,
              type: true,
              read: true,
              createdAt: true,
              eventId: true,
              taskId: true,
              messageId: true,
              announcementId: true
            },
            orderBy: { createdAt: "desc" },
            take: 50
          })
          return { notifications, count: notifications.length }

        case "migrate":
          // Миграция уведомлений для задач
          const assignedTasks = await tx.task.findMany({
            where: { assigneeId: userId },
            select: { id: true }
          })
          
          const existingNotifications = await tx.notification.findMany({
            where: {
              userId,
              type: "TASK",
              taskId: { in: assignedTasks.map(t => t.id) }
            },
            select: { taskId: true }
          })
          
          const existingTaskIds = new Set(existingNotifications.map(n => n.taskId))
          const tasksWithoutNotifications = assignedTasks
            .filter(task => !existingTaskIds.has(task.id))
            .map(task => ({
              type: "TASK" as const,
              userId,
              taskId: task.id,
              read: false
            }))
          
          if (tasksWithoutNotifications.length > 0) {
            await tx.notification.createMany({ data: tasksWithoutNotifications })
          }
          
          return { migrated: tasksWithoutNotifications.length }

        default:
          throw new Error("Invalid action")
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Batch notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 