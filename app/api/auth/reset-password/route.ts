import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"
import { hash } from "bcrypt"

// POST /api/auth/reset-password - Сброс пароля
export async function POST(request: NextRequest) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: "Токен и пароль обязательны" }, { status: 400 })
    }

    // Проверяем, существует ли токен и не истек ли он
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires: {
          gt: new Date(),
        },
      },
    })

    if (!verificationToken) {
      return NextResponse.json({ error: "Недействительный или истекший токен" }, { status: 400 })
    }

    // Находим пользователя по email
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    // Хешируем новый пароль
    const hashedPassword = await hash(password, 10)

    // Обновляем пароль пользователя
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Удаляем использованный токен
    await prisma.verificationToken.delete({
      where: { token },
    })

    return NextResponse.json({ message: "Пароль успешно сброшен" })
  } catch (error) {
    console.error("Ошибка при сбросе пароля:", error)
    return NextResponse.json({ error: "Ошибка при сбросе пароля" }, { status: 500 })
  }
}

