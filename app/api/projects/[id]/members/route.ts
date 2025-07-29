import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/projects/[id]/members - Получить участников проекта
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
            position: true,
            email: true,
            department: true,
          },
        },
      },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Ошибка при получении участников проекта:", error)
    return NextResponse.json({ error: "Ошибка при получении участников проекта" }, { status: 500 })
  }
}

// POST /api/projects/[id]/members - Добавить участника в проект
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
    if (!body.userId || !body.role) {
      return NextResponse.json({ error: "ID пользователя и роль обязательны" }, { status: 400 })
    }

    // Проверяем, существует ли проект
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 })
    }

    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Проверяем, не является ли пользователь уже участником проекта
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: params.id,
        userId: body.userId,
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "Пользователь уже является участником проекта" }, { status: 400 })
    }

    // Добавляем участника
    const member = await prisma.projectMember.create({
      data: {
        projectId: params.id,
        userId: body.userId,
        role: body.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
            position: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error("Ошибка при добавлении участника:", error)
    return NextResponse.json({ error: "Ошибка при добавлении участника" }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/members/[memberId] - Удалить участника из проекта
export async function DELETE(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    // Проверяем, существует ли участник
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: params.id,
        id: params.memberId,
      },
    })

    if (!existingMember) {
      return NextResponse.json({ error: "Участник не найден" }, { status: 404 })
    }

    // Удаляем участника
    await prisma.projectMember.delete({
      where: { id: params.memberId },
    })

    return NextResponse.json({ message: "Участник успешно удален из проекта" })
  } catch (error) {
    console.error("Ошибка при удалении участника:", error)
    return NextResponse.json({ error: "Ошибка при удалении участника" }, { status: 500 })
  }
}

