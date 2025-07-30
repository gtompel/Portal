import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Перенаправляем на единый endpoint
export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Перенаправляем запрос на единый endpoint
    const url = new URL(request.url)
    const unifiedUrl = new URL('/api/analytics/unified', url.origin)
    unifiedUrl.search = url.search

    const response = await fetch(unifiedUrl.toString(), {
      headers: {
        'Authorization': request.headers.get('authorization') || '',
        'Cookie': request.headers.get('cookie') || ''
      }
    })

    if (!response.ok) {
      throw new Error("Не удалось получить данные")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Ошибка при получении аналитических данных:", error)
    return NextResponse.json(
      { error: "Ошибка при получении аналитических данных" }, 
      { status: 500 }
    )
  }
}

