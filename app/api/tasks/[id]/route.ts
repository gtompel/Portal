import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/tasks/[id] - Получить задачу по ID
export async function GET(request: NextRequest, context: { params: { id: string } }) {
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
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.assigneeId !== undefined) {
      updateData.assigneeId = body.assigneeId === "" || body.assigneeId === "not_assigned" ? null : body.assigneeId;
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

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Ошибка при обновлении задачи:", error);
    return NextResponse.json({ error: "Ошибка при обновлении задачи", details: String(error) }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Удалить задачу
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    // Проверяем, существует ли задача
    const existingTask = await prisma.task.findUnique({
      where: { id },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 })
    }

    // Удаляем задачу
    await prisma.task.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Задача успешно удалена" })
  } catch (error) {
  //  console.error("Ошибка при удалении задачи:", error)
    return NextResponse.json({ error: "Ошибка при удалении задачи" }, { status: 500 })
  }
}
