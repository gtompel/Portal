import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { emitTaskEvent } from "@/lib/events"
import { checkApiAuth } from "@/lib/api-auth"

// GET /api/tasks/[id] - Получить задачу по ID
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const authResult = await checkApiAuth(request)
  if (!authResult.success) {
    return authResult.response!
  }
  try {
    const { id } = await context.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        comments: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
  //  console.error("Ошибка при получении задачи:", error)
    return NextResponse.json({ error: "Ошибка при получении задачи" }, { status: 500 })
  }
}

// PUT /api/tasks/[id] - Обновить задачу
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const authResult = await checkApiAuth(request)
  if (!authResult.success) {
    return authResult.response!
  }
  try {
    const { id } = await context.params;
    const body = await request.json()

    // Проверяем, существует ли задача
    const existingTask = await prisma.task.findUnique({
      where: { id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 })
    }

    // Подготавливаем данные для обновления
    const updateData: any = {}

    // Обновляем только предоставленные поля
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.networkType !== undefined) updateData.networkType = body.networkType
    if (body.dayType !== undefined) updateData.dayType = body.dayType
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.assigneeId !== undefined) {
      updateData.assigneeId = body.assigneeId === "" || body.assigneeId === "not_assigned" ? null : body.assigneeId;
    }
    if (body.isArchived !== undefined) {
      updateData.isArchived = body.isArchived
      
      // Если задача восстанавливается из архива, назначаем новый номер (в конце списка)
      if (body.isArchived === false) {
        const existingActiveTasks = await prisma.task.findMany({
          where: { isArchived: false }
        });
        const maxTaskNumber = existingActiveTasks.reduce(
          (max, task: any) => Math.max(max, task.taskNumber || 0),
          0
        );
        updateData.taskNumber = maxTaskNumber + 1;
      }
    }

    // Обновляем задачу
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Определяем тип события в зависимости от изменений
    let eventType: any = 'task_updated'
    if (body.status !== undefined && body.status !== (existingTask as any).status) {
      eventType = 'task_status_changed'
    } else if (body.priority !== undefined && body.priority !== (existingTask as any).priority) {
      eventType = 'task_priority_changed'
    } else if (body.networkType !== undefined && body.networkType !== (existingTask as any).networkType) {
      eventType = 'task_network_type_changed'
    } else if (body.isArchived !== undefined && body.isArchived !== (existingTask as any).isArchived) {
      eventType = body.isArchived ? 'task_archived' : 'task_updated'
    }

    // Отправляем событие об обновлении задачи
    emitTaskEvent(eventType, { 
      taskId: updatedTask.id, 
      task: updatedTask,
      userId: updatedTask.creatorId 
    })

    // Обработка смены исполнителя
    if (body.assigneeId !== undefined && body.assigneeId !== (existingTask as any).assigneeId) {
      const oldAssigneeId = (existingTask as any).assigneeId;
      const newAssigneeId = body.assigneeId === "" || body.assigneeId === "not_assigned" ? null : body.assigneeId;

      // Удаляем уведомление для старого исполнителя, если он был
      if (oldAssigneeId) {
        await prisma.notification.deleteMany({
          where: {
            userId: oldAssigneeId,
            taskId: updatedTask.id,
            type: "TASK",
          },
        });
      }

      // Создаём уведомление для нового исполнителя, если он назначен
      if (newAssigneeId) {
        emitTaskEvent('task_assigned', {
          taskId: updatedTask.id,
          task: updatedTask,
          userId: newAssigneeId,
        });
        
        await prisma.notification.create({
          data: {
            type: "TASK",
            userId: newAssigneeId,
            taskId: updatedTask.id,
            read: false,
          },
        });
      }
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Ошибка при обновлении задачи:", error);
    return NextResponse.json({ error: "Ошибка при обновлении задачи", details: String(error) }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Удалить задачу
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const authResult = await checkApiAuth(request)
  if (!authResult.success) {
    return authResult.response!
  }
  try {
    const { id } = await context.params;
    // Проверяем, существует ли задача
    const existingTask = await prisma.task.findUnique({
      where: { id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 })
    }

    // Удаляем связанные уведомления
    await prisma.notification.deleteMany({
      where: {
        taskId: id,
        type: "TASK",
      },
    });

    // Удаляем задачу
    await prisma.task.delete({
      where: { id },
    })

    // Отправляем событие об удалении задачи
    emitTaskEvent('task_deleted', { 
      taskId: id,
      userId: existingTask.creatorId 
    })

    return NextResponse.json({ message: "Задача успешно удалена" })
  } catch (error) {
  //  console.error("Ошибка при удалении задачи:", error)
    return NextResponse.json({ error: "Ошибка при удалении задачи" }, { status: 500 })
  }
}
