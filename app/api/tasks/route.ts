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
    const authResult = await checkApiAuth(request)
    if (!authResult.success) {
      return authResult.response!
    }
    const body = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      const [creator, maxTask] = await Promise.all([
        tx.user.findUnique({ where: { id: body.creatorId } }),
        tx.task.aggregate({ where: { isArchived: false }, _max: { taskNumber: true } })
      ]);
      if (!creator) throw new Error("Пользователь-создатель не найден");
      const newTaskNumber = (maxTask._max.taskNumber || 0) + 1;
      const task = await tx.task.create({
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
          assignee: { select: { id: true, name: true, avatar: true, initials: true } },
          creator: { select: { id: true, name: true } },
        },
      });
      if (task.assigneeId) {
        await tx.notification.create({
          data: {
            type: "TASK",
            userId: task.assigneeId,
            taskId: task.id,
            read: false,
          },
        });
      }
      return task;
    });
    emitTaskEvent('task_created', { taskId: result.id, task: result, userId: body.creatorId });
    return createSuccessResponse(result, 201);
  } catch (error) {
    return handleDatabaseError(error);
  }
}
