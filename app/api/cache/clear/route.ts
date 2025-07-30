import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { cache } from "@/lib/cache"

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
    const { pattern } = body

    if (pattern) {
      // Очищаем кэш по паттерну
      const keys = Array.from(cache['cache'].keys())
      const matchingKeys = keys.filter(key => key.includes(pattern))
      matchingKeys.forEach(key => cache.delete(key))
      
      return NextResponse.json({ 
        message: `Cleared ${matchingKeys.length} cache entries matching pattern: ${pattern}` 
      })
    } else {
      // Очищаем весь кэш
      cache.clear()
      return NextResponse.json({ message: "All cache cleared" })
    }
  } catch (error) {
    console.error("Error clearing cache:", error)
    return NextResponse.json({ error: "Error clearing cache" }, { status: 500 })
  }
} 