import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/tasks - Получить все задачи
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const assigneeId = searchParams.get("assigneeId");

    let whereClause = {};

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
        priority: body.priority || "MEDIUM",
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Ошибка при создании задачи:", error);
    return NextResponse.json(
      { error: "Ошибка при создании задачи" },
      { status: 500 }
    );
  }
}
