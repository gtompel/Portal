import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/tasks/[id]/comments - Получить комментарии к задаче
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: params.id },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Ошибка при получении комментариев:", error)
    return NextResponse.json({ error: "Ошибка при получении комментариев" }, { status: 500 })
  }
}

// POST /api/tasks/[id]/comments - Добавить комментарий к задаче
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const body = await request.json()

    // Проверка обязательных полей
    if (!body.content || !body.author) {
      return NextResponse.json({ error: "Содержание комментария и автор обязательны" }, { status: 400 })
    }

    // Проверяем, существует ли задача
    const task = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return NextResponse.json({ error: "Задача не найдена" }, { status: 404 })
    }

    // Создаем комментарий
    const comment = await prisma.taskComment.create({
      data: {
        content: body.content,
        author: body.author,
        taskId: params.id,
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании комментария:", error)
    return NextResponse.json({ error: "Ошибка при создании комментария" }, { status: 500 })
  }
}

