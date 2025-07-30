import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { cache } from "@/lib/cache"

// GET /api/projects/[id]/tasks - Получить задачи проекта
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = context.params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    // Проверяем, существует ли проект
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 })
    }

    // Создаем ключ кэша
    const cacheKey = `project-tasks:${projectId}:${status || 'all'}:${search || 'none'}`
    
    // Проверяем кэш
    const cachedTasks = cache.get(cacheKey)
    if (cachedTasks) {
      return NextResponse.json(cachedTasks)
    }

    // Получаем ID участников проекта
    const memberIds = project.members.map(member => member.user.id)

    let whereClause: any = {
      OR: [
        { assigneeId: { in: memberIds } },
        { creatorId: { in: memberIds } }
      ]
    }

    if (status && status !== "all") {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { assigneeId: { in: memberIds } },
        { creatorId: { in: memberIds } }
      ]
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
            avatar: true,
            initials: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Кэшируем результат на 2 минуты
    cache.set(cacheKey, tasks, 120000)

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Ошибка при получении задач проекта:", error)
    return NextResponse.json(
      { error: "Ошибка при получении задач проекта" }, 
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/tasks - Создать задачу для проекта
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = context.params
    const body = await request.json()

    // Проверяем, существует ли проект
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
              }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 })
    }

    // Проверяем, является ли пользователь участником проекта
    const isMember = project.members.some(member => member.user.id === token.sub)
    if (!isMember) {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }

    // Создаем задачу
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status || "NEW",
        priority: body.priority || "LOW",
        networkType: body.networkType || "EMVS",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assigneeId: body.assigneeId || null,
        creatorId: token.sub,
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
            avatar: true,
            initials: true,
          },
        },
      },
    })

    // Очищаем кэш
    cache.del(`project-tasks:${projectId}:*`)

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании задачи:", error)
    return NextResponse.json(
      { error: "Ошибка при создании задачи" }, 
      { status: 500 }
    )
  }
} 