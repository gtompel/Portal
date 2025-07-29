import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/projects/[id] - Получить проект по ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        members: {
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
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Ошибка при получении проекта:", error)
    return NextResponse.json({ error: "Ошибка при получении проекта" }, { status: 500 })
  }
}

// PUT /api/projects/[id] - Обновить проект
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const body = await request.json()

    // Проверяем, существует ли проект
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 })
    }

    // Подготавливаем данные для обновления
    const updateData: any = {}

    // Обновляем только предоставленные поля
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null

    // Обновляем проект
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                initials: true,
                position: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Ошибка при обновлении проекта:", error)
    return NextResponse.json({ error: "Ошибка при обновлении проекта" }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Удалить проект
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    // Проверяем, существует ли проект
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Проект не найден" }, { status: 404 })
    }

    // Удаляем проект
    await prisma.project.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Проект успешно удален" })
  } catch (error) {
    console.error("Ошибка при удалении проекта:", error)
    return NextResponse.json({ error: "Ошибка при удалении проекта" }, { status: 500 })
  }
}

