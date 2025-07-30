import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { clearCache } from "@/lib/cache-utils"

// POST /api/cache/clear - Очистить кэш
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const pattern = body.pattern // Опциональный паттерн для частичной очистки

    clearCache(pattern)

    return NextResponse.json({ 
      message: pattern ? `Кэш очищен для паттерна: ${pattern}` : "Весь кэш очищен" 
    })
  } catch (error) {
    console.error("Ошибка при очистке кэша:", error)
    return NextResponse.json({ error: "Ошибка при очистке кэша" }, { status: 500 })
  }
} 