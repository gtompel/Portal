import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcrypt"

// GET /api/users/[id] - Получить пользователя по ID
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = await context.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        skills: true,
        education: true,
        experience: true,
        manager: {
          select: {
            id: true,
            name: true,
            position: true,
            email: true,
          },
        },
        projects: {
          include: {
            project: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Исключаем пароль из ответа
    const { password, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("Ошибка при получении пользователя:", error)
    return NextResponse.json({ error: "Ошибка при получении пользователя" }, { status: 500 })
  }
}

// PUT /api/users/[id] - Обновить пользователя
export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Получаем id из params
    const { id } = await context.params

    const body = await request.json()

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Подготавливаем данные для обновления
    const updateData: any = {}

    // Обновляем только предоставленные поля
    if (body.name) updateData.name = body.name
    if (body.position) updateData.position = body.position
    if (body.department) updateData.department = body.department
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.avatar !== undefined) updateData.avatar = body.avatar
    if (body.initials) updateData.initials = body.initials
    if (body.status) updateData.status = body.status
    if (body.location !== undefined) updateData.location = body.location
    if (body.hireDate) updateData.hireDate = new Date(body.hireDate)
    if (body.birthday) updateData.birthday = new Date(body.birthday)
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.managerId !== undefined) updateData.managerId = body.managerId

    // Если предоставлен новый пароль, хешируем его
    if (body.password) {
      updateData.password = await hash(body.password, 10)
    }

    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
        phone: true,
        avatar: true,
        initials: true,
        status: true,
        location: true,
        hireDate: true,
        birthday: true,
        bio: true,
        managerId: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Ошибка при обновлении пользователя:", error)
    return NextResponse.json({ error: "Ошибка при обновлении пользователя" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Удалить пользователя
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    // Получаем id из params
    const { id } = await context.params

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Удаляем пользователя
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Пользователь успешно удален" })
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error)
    return NextResponse.json({ error: "Ошибка при удалении пользователя" }, { status: 500 })
  }
}

