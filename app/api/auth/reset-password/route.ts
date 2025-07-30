import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"
import { z } from "zod"

// Схема валидации для сброса пароля
const resetPasswordSchema = z.object({
  email: z.string().email("Неверный формат email"),
  newPassword: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  resetToken: z.string().optional()
})

// Схема валидации для запроса сброса пароля
const requestResetSchema = z.object({
  email: z.string().email("Неверный формат email")
})

// POST /api/auth/reset-password - Запрос сброса пароля
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Проверяем, есть ли resetToken в запросе
    if (body.resetToken) {
      // Если есть токен, это завершение сброса пароля
      const validatedData = resetPasswordSchema.parse(body)
      
      // Проверяем, существует ли пользователь
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: "Пользователь с таким email не найден" },
          { status: 404 }
        )
      }
      
      // Хешируем новый пароль
      const hashedPassword = await hash(validatedData.newPassword, 10)
      
      // Обновляем пароль пользователя
      await prisma.user.update({
        where: { email: validatedData.email },
        data: { password: hashedPassword }
      })
      
      return NextResponse.json({ 
        message: "Пароль успешно изменен" 
      })
      
    } else {
      // Если нет токена, это запрос на сброс пароля
      const validatedData = requestResetSchema.parse(body)
      
      // Проверяем, существует ли пользователь
      const user = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })
      
      if (!user) {
        return NextResponse.json(
          { error: "Пользователь с таким email не найден" },
          { status: 404 }
        )
      }
      
      // Генерируем токен для сброса пароля (в реальном приложении отправляли бы email)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      
      // Сохраняем токен в базе данных (в реальном приложении)
      // await prisma.user.update({
      //   where: { email: validatedData.email },
      //   data: { resetToken, resetTokenExpiry: new Date(Date.now() + 3600000) } // 1 час
      // })
      
      // В демо-версии возвращаем токен напрямую
      return NextResponse.json({ 
        message: "Запрос на сброс пароля отправлен",
        resetToken: resetToken, // В реальном приложении не возвращали бы токен
        email: validatedData.email
      })
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неверные данные", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Ошибка при сбросе пароля:", error)
    return NextResponse.json(
      { error: "Ошибка при сбросе пароля" },
      { status: 500 }
    )
  }
}

