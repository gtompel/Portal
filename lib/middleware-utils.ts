import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { CorsConfig, SecurityConfig } from '@/types/middleware'

// Конфигурация CORS
export const corsConfig: CorsConfig = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://172.16.10.245:3000',
    'https://portal-arm.vercel.app',
    'http://localhost',
    'http://127.0.0.1'
  ],
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
  if (!origin) return false
  console.log('isAllowedOrigin check:', { origin, corsConfigOrigin: corsConfig.origin })
  if (Array.isArray(corsConfig.origin)) {
    const result = corsConfig.origin.some(o => o === origin)
    console.log('Array check result:', result)
    return result
  }
  const result = corsConfig.origin === origin
  console.log('String check result:', result)
  return result
}

// Добавление CORS заголовков
export function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin') || ''
  console.log('CORS: request origin =', origin, 'allowed =', isAllowedOrigin(origin))

  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  // Не ставим Access-Control-Allow-Origin: * если credentials=true и origin пустой!

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

// Кэш для проверки аутентификации (5 секунд)
const authCache = new Map<string, { result: boolean; timestamp: number }>()
const AUTH_CACHE_TTL = 5000 // 5 секунд

// Проверка аутентификации
export async function checkAuth(request: NextRequest): Promise<boolean> {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET is not defined')
      return false
    }

    // Проверяем кэш
    const cacheKey = request.headers.get('cookie') || 'no-cookie'
    const cached = authCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < AUTH_CACHE_TTL) {
      return cached.result
    }

    // Определяем имя куки на основе NEXTAUTH_URL
    const url = process.env.NEXTAUTH_URL || '';
    const host = url.replace(/^https?:\/\//, '').split(':')[0];
    const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(host);
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    
    const cookieName = (isIP || isLocalhost) 
      ? 'next-auth.session-token'
      : '__Secure-next-auth.session-token';

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName
    })

    const result = !!token

    // Кэшируем результат
    authCache.set(cacheKey, { result, timestamp: Date.now() })

    if (process.env.NODE_ENV === 'development') {
      console.log('Auth check for:', request.nextUrl.pathname)
      console.log('Token exists:', result)
      console.log('Cookie name used:', cookieName)
      if (token) {
        console.log('Token payload:', { id: token.id, email: token.email, role: token.role })
      }
    }

    return result
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

export function checkRateLimit(ip: string, limit: number = 1000, windowMs: number = 15 * 60 * 1000): boolean {
  // Увеличиваем лимиты для локальной разработки
  const actualLimit = process.env.NODE_ENV === 'development' ? 10000 : limit
  const actualWindow = process.env.NODE_ENV === 'development' ? 60 * 1000 : windowMs // 1 минута для dev
  
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + actualWindow })
    return true
  }
  
  if (record.count >= actualLimit) {
    return false
  }
  
  record.count++
  return true
} 