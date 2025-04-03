import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    // Получаем текущую дату и дату неделю назад
    const now = new Date()
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Получаем статистику по задачам
    const totalTasks = await prisma.task.count()
    const totalTasksLastWeek = await prisma.task.count({
      where: {
        createdAt: {
          lt: oneWeekAgo,
        },
      },
    })
    const totalTasksDiff = totalTasks - totalTasksLastWeek

    const activeTasks = await prisma.task.count({
      where: {
        status: {
          in: ["NEW", "IN_PROGRESS", "REVIEW"],
        },
      },
    })
    const activeTasksLastWeek = await prisma.task.count({
      where: {
        status: {
          in: ["NEW", "IN_PROGRESS", "REVIEW"],
        },
        createdAt: {
          lt: oneWeekAgo,
        },
      },
    })
    const activeTasksDiff = activeTasks - activeTasksLastWeek

    // Получаем статистику по документам
    const totalDocuments = await prisma.document.count()
    const totalDocumentsLastWeek = await prisma.document.count({
      where: {
        createdAt: {
          lt: oneWeekAgo,
        },
      },
    })
    const documentsDiff = totalDocuments - totalDocumentsLastWeek

    // Получаем статистику по объявлениям
    const totalAnnouncements = await prisma.announcement.count()
    const totalAnnouncementsLastWeek = await prisma.announcement.count({
      where: {
        createdAt: {
          lt: oneWeekAgo,
        },
      },
    })
    const announcementsDiff = totalAnnouncements - totalAnnouncementsLastWeek

    return NextResponse.json({
      tasks: {
        total: totalTasks,
        active: activeTasks,
        totalDiff: totalTasksDiff,
        activeDiff: activeTasksDiff,
      },
      documents: {
        total: totalDocuments,
        diff: documentsDiff,
      },
      announcements: {
        total: totalAnnouncements,
        diff: announcementsDiff,
      },
    })
  } catch (error) {
    console.error("Ошибка при получении статистики:", error)
    return NextResponse.json({ error: "Ошибка при получении статистики" }, { status: 500 })
  }
}

