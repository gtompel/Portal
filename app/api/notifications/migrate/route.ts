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
    const result = await prisma.$transaction(async (tx) => {
      // Получаем задачи пользователя
      const assignedTasks = await tx.task.findMany({
        where: { assigneeId: userId },
        select: { id: true }
      });
      
      // Получаем существующие уведомления для этих задач
      const existingNotifications = await tx.notification.findMany({
        where: {
          userId,
          type: "TASK",
          taskId: { in: assignedTasks.map(task => task.id) }
        },
        select: { taskId: true }
      });
      
      const existingTaskIds = new Set(existingNotifications.map(n => n.taskId));
      const tasksWithoutNotifications = assignedTasks
        .filter(task => !existingTaskIds.has(task.id))
        .map(task => ({
          type: "TASK" as const,
          userId,
          taskId: task.id,
          read: false,
        }));
      
      if (tasksWithoutNotifications.length > 0) {
        await tx.notification.createMany({ data: tasksWithoutNotifications });
      }
      
      return { created: tasksWithoutNotifications.length };
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error migrating notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 