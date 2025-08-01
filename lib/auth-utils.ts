import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { getSession } from "next-auth/react"

export async function checkApiAuth(request: NextRequest): Promise<{ authorized: boolean; userId?: string; response?: NextResponse }> {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return { 
        authorized: false, 
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }
    
    return { authorized: true, userId: token.sub }
  } catch (error) {
    console.error("Auth check error:", error)
    return { 
      authorized: false, 
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }
} 

// Функция для обработки ошибок API с автоматическим обновлением токена
export async function handleApiError(response: Response, retryCount = 0): Promise<Response> {
  if (response.status === 401 && retryCount < 2) {
    try {
      // Пытаемся обновить сессию
      const session = await getSession()
      if (session) {
        // Повторяем запрос с обновленным токеном
        return fetch(response.url, {
          ...response,
          headers: {
            ...response.headers,
            'Authorization': `Bearer ${session.accessToken}`
          }
        })
      }
    } catch (error) {
      // Игнорируем ошибки обновления токена
    }
  }
  
  return response
}

// Функция для безопасного выполнения API запросов
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries) {
        // Ждем перед повторной попыткой
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }
  
  throw lastError
} 