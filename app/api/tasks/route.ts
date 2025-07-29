import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { emitTaskEvent } from "@/lib/events";

// GET /api/tasks - Получить все задачи
export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
  //  console.error("Ошибка при получении задач:", error);
    return NextResponse.json(
      { error: "Ошибка при получении задач" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Создать новую задачу
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Проверка обязательных полей
    if (!body.title || !body.creatorId) {
      return NextResponse.json(
        { error: "Название задачи и ID создателя обязательны" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли пользователь-создатель
    const creator = await prisma.user.findUnique({
      where: { id: body.creatorId },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Пользователь-создатель не найден" },
        { status: 404 }
      );
    }

    //Получаем текущие задачи для назначения следующего номера
    const existingTasks = await prisma.task.findMany();
    const maxTaskNumber = existingTasks.reduce(
      (max, task: any) => Math.max(max, task.taskNumber || 0),
      0
    );
    
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
        taskNumber: maxTaskNumber + 1,
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Ошибка при создании задачи:", error);
    return NextResponse.json(
      { error: "Ошибка при создании задачи" },
      { status: 500 }
    );
  }
}
