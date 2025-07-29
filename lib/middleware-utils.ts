import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { CorsConfig, SecurityConfig } from '@/types/middleware'

// Конфигурация CORS
export const corsConfig: CorsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Замени на свой домен
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
  credentials: true
}

// Конфигурация безопасности
export const securityConfig: SecurityConfig = {
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss: https://va.vercel-scripts.com; frame-src 'self';",
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  xXssProtection: '1; mode=block',
  referrerPolicy: 'strict-origin-when-cross-origin'
}

// Проверка, является ли запрос из разрешенного источника
export function isAllowedOrigin(origin: string): boolean {
  if (typeof corsConfig.origin === 'string') {
    return corsConfig.origin === origin
  }
  return corsConfig.origin.includes(origin)
}

// Добавление CORS заголовков
export function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')
  
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else if (corsConfig.credentials) {
    response.headers.set('Access-Control-Allow-Origin', 'null')
  }
  
  response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', corsConfig.headers.join(', '))
  response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString())
  
  if (corsConfig.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
}

// Добавление security заголовков
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', securityConfig.xContentTypeOptions)
  response.headers.set('X-Frame-Options', securityConfig.xFrameOptions)
  response.headers.set('X-XSS-Protection', securityConfig.xXssProtection)
  response.headers.set('Referrer-Policy', securityConfig.referrerPolicy)
  response.headers.set('Content-Security-Policy', securityConfig.contentSecurityPolicy)
  
  return response
}

// Проверка аутентификации
export async function checkAuth(request: NextRequest): Promise<boolean> {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    return !!token
  } catch (error) {
    console.error('Auth check error:', error)
    return false
  }
}

// Логирование запросов
export function logRequest(request: NextRequest, level: 'info' | 'warn' | 'error' = 'info'): void {
  if (process.env.NODE_ENV === 'development') {
    const { method, nextUrl } = request
    const timestamp = new Date().toISOString()
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ip = getClientIP(request)
    
    const logMessage = `[${timestamp}] ${method} ${nextUrl.pathname} - IP: ${ip} - UA: ${userAgent}`
    
    switch (level) {
      case 'warn':
        console.warn(logMessage)
        break
      case 'error':
        console.error(logMessage)
        break
      default:
        console.log(logMessage)
    }
  }
}

// Создание ответа с ошибкой
export function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

// Создание редиректа с сохранением URL
export function createRedirectResponse(url: string, request: NextRequest): NextResponse {
  const redirectUrl = new URL(url, request.url)
  if (url.startsWith('/auth/login')) {
    redirectUrl.searchParams.set('callbackUrl', request.url)
  }
  return NextResponse.redirect(redirectUrl)
}

// Проверка, является ли запрос API
export function isApiRequest(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

// Проверка, является ли запрос статическим файлом
export function isStaticFile(pathname: string): boolean {
  const staticExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js']
  return staticExtensions.some(ext => pathname.endsWith(ext))
}

// Получение IP адреса клиента
export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'Unknown'
}

// Rate limiting (базовая реализация)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
} 