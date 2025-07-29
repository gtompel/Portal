import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.sub;

    // Находим все задачи, где пользователь является исполнителем
    const assignedTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
      },
      select: {
        id: true,
      },
    });

    // Проверяем, какие уведомления уже существуют
    const existingNotifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        type: "TASK",
        taskId: {
          in: assignedTasks.map(task => task.id),
        },
      },
      select: {
        taskId: true,
      },
    });

    const existingTaskIds = new Set(existingNotifications.map(n => n.taskId));
    const tasksWithoutNotifications = assignedTasks.filter(
      task => !existingTaskIds.has(task.id)
    );

    // Создаём уведомления для задач без уведомлений
    if (tasksWithoutNotifications.length > 0) {
      await prisma.notification.createMany({
        data: tasksWithoutNotifications.map(task => ({
          type: "TASK",
          userId: userId,
          taskId: task.id,
          read: false,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      created: tasksWithoutNotifications.length,
    });

  } catch (error) {
    console.error("Error migrating notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 