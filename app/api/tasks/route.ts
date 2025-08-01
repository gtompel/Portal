import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitTaskEvent } from "@/lib/events";
import { checkApiAuth, createSuccessResponse, createErrorResponse, handleDatabaseError } from "@/lib/api-auth";

// GET /api/tasks - Получить все задачи
export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const authResult = await checkApiAuth(request)
    
    if (!authResult.success) {
      return authResult.response!
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const assigneeId = searchParams.get("assigneeId");
    const showArchived = searchParams.get("showArchived") === "true";



    let whereClause = {};

    // Фильтруем по статусу архивирования
    if (showArchived) {
      // Показываем только архивные задачи
      whereClause = {
        ...whereClause,
        isArchived: true,
      };
    } else {
      // Показываем только неархивные задачи
      whereClause = {
        ...whereClause,
        isArchived: false,
      };
    }

    if (status && status !== "all") {
      whereClause = {
        ...whereClause,
        status: status,
      };
    }

    if (assigneeId) {
      whereClause = {
        ...whereClause,
        assigneeId: assigneeId,
      };
    }

    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const tasks = await prisma.task.findMany({
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
        updatedAt: true,
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
      orderBy: {
        taskNumber: "desc",
      },
      take: 100, // Ограничиваем количество задач для производительности
    });

    return createSuccessResponse(tasks);
  } catch (error) {
    return handleDatabaseError(error);
  }
}

// POST /api/tasks - Создать новую задачу
export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const authResult = await checkApiAuth(request)
    
    if (!authResult.success) {
      return authResult.response!
    }
    
    const body = await request.json();

    // Проверка обязательных полей
    if (!body.title || !body.creatorId) {
      return createErrorResponse("Название задачи и ID создателя обязательны", 400);
    }

    // Проверяем, существует ли пользователь-создатель
    const creator = await prisma.user.findUnique({
      where: { id: body.creatorId },
    });

    if (!creator) {
      return createErrorResponse("Пользователь-создатель не найден", 404);
    }

    // Генерируем номер задачи на основе активных задач
    const existingActiveTasks = await prisma.task.findMany({
      where: { isArchived: false }
    });
    const maxTaskNumber = existingActiveTasks.reduce(
      (max, task: any) => Math.max(max, task.taskNumber || 0),
      0
    );
    
    // Новые задачи получают больший номер (создаются в конце списка)
    const newTaskNumber = maxTaskNumber + 1;
    
    // Создание задачи
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description || null,
        status: body.status || "NEW",
        priority: body.priority || "LOW",
        networkType: body.networkType || "EMVS",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assigneeId: body.assigneeId || null,
        creatorId: body.creatorId,
        taskNumber: newTaskNumber,
      },
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
    });

    // Создаём уведомление для исполнителя, если он назначен
    if (task.assigneeId) {
      await prisma.notification.create({
        data: {
          type: "TASK",
          userId: task.assigneeId,
          taskId: task.id,
          read: false,
        },
      });
    }



    // Отправляем событие о создании задачи
    emitTaskEvent('task_created', { 
      taskId: task.id, 
      task: task,
      userId: body.creatorId 
    });

    return createSuccessResponse(task, 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
