import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export interface AuthResult {
  success: boolean
  userId?: string
  userRole?: string
  response?: NextResponse
}

// Функция для проверки аутентификации в API роутах
export async function checkApiAuth(request: NextRequest): Promise<AuthResult> {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        )
      }
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token?.sub) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
    }

    return {
      success: true,
      userId: token.sub,
      userRole: token.role as string
    }
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      )
    }
  }
}

// Функция для создания успешного ответа с данными
export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

// Функция для создания ответа с ошибкой
export function createErrorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

// Функция для обработки ошибок базы данных
export function handleDatabaseError(error: any): NextResponse {
  if (error.code === 'P2002') {
    return createErrorResponse('Данные уже существуют', 409)
  }
  
  if (error.code === 'P2025') {
    return createErrorResponse('Запись не найдена', 404)
  }
  
  return createErrorResponse('Ошибка базы данных', 500)
} 