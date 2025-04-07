import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"

// POST /api/auth/forgot-password - Запрос на восстановление пароля
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email обязателен" }, { status: 400 })
    }

    // Проверяем, существует ли пользователь с таким email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // По соображениям безопасности не сообщаем, что пользователь не найден
      return NextResponse.json({
        message: "Если указанный email зарегистрирован, инструкции по восстановлению пароля будут отправлены",
      })
    }

    // Генерируем токен для сброса пароля
    const token = uuidv4()
    const expires = new Date()
    expires.setHours(expires.getHours() + 1) // Токен действителен 1 час

    // Сохраняем токен в базе данных
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    })

    // В реальном приложении здесь был бы код для отправки email
    // Например, с использованием nodemailer или другого сервиса

    // Формируем ссылку для сброса пароля
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

    console.log("Ссылка для сброса пароля:", resetUrl)

    return NextResponse.json({
      message: "Если указанный email зарегистрирован, инструкции по восстановлению пароля будут отправлены",
    })
  } catch (error) {
    console.error("Ошибка при запросе на восстановление пароля:", error)
    return NextResponse.json({ error: "Ошибка при запросе на восстановление пароля" }, { status: 500 })
  }
}

