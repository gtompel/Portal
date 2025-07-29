import { NextRequest, NextResponse } from 'next/server'
import { 
  addCorsHeaders, 
  addSecurityHeaders, 
  checkAuth, 
  logRequest, 
  isApiRequest, 
  isStaticFile,
  getClientIP,
  checkRateLimit,
  createErrorResponse,
  createRedirectResponse
} from '@/lib/middleware-utils'

// Публичные роуты, которые не требуют аутентификации
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register', 
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth',
  '/favicon.ico',
  '/logo.png',
  '/ARM.png',
]

// API роуты, которые не требуют аутентификации
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/upload',
]

// Роуты, которые требуют аутентификации
const PROTECTED_ROUTES = [
  '/dashboard',
  '/tasks',
  '/projects', 
  '/employees',
  '/documents',
  '/messages',
  '/calendar',
  '/analytics',
  '/announcements',
  '/settings',
  '/help',
]

// Проверка, является ли роут публичным
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

// Проверка, является ли API роут публичным
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))
}

// Проверка, является ли роут защищенным
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Логирование запросов
  logRequest(request)
  
  // Rate limiting
  const clientIP = getClientIP(request)
  if (!checkRateLimit(clientIP)) {
    return createErrorResponse('Too Many Requests', 429)
  }
  
  // Обработка OPTIONS запросов для CORS
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    return addCorsHeaders(response, request)
  }
  
  // Обработка API роутов
  if (isApiRequest(pathname)) {
    const response = NextResponse.next()
    
    // Добавляем CORS для всех API роутов
    addCorsHeaders(response, request)
    
    // Проверяем аутентификацию для защищенных API роутов
    if (!isPublicApiRoute(pathname)) {
      const isAuthenticated = await checkAuth(request)
      
      if (!isAuthenticated) {
        return createErrorResponse('Unauthorized', 401)
      }
    }
    
    return addSecurityHeaders(response)
  }
  
  // Обработка страниц
  if (pathname.startsWith('/')) {
    // Публичные роуты пропускаем
    if (isPublicRoute(pathname)) {
      const response = NextResponse.next()
      return addSecurityHeaders(response)
    }
    
    // Проверяем аутентификацию для защищенных роутов
    if (isProtectedRoute(pathname)) {
      const isAuthenticated = await checkAuth(request)
      
      if (!isAuthenticated) {
        return createRedirectResponse('/auth/login', request)
      }
    }
    
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }
  
  // Для всех остальных запросов
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

// Конфигурация matcher для оптимизации производительности
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 