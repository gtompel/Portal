import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Возвращаем текущее время для polling
    return NextResponse.json({
      type: 'polling',
      timestamp: Date.now(),
      userId: token.sub
    })
  } catch (error) {
    console.error('Polling API error:', error)
    return NextResponse.json({ error: 'Polling Error' }, { status: 500 })
  }
} 