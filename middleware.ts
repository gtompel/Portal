import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Публичные роуты, которые не требуют аутентификации
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register', 
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/auth',
  '/api/auth/reset-password',
  '/favicon.ico',
  '/logo.png',
  '/ARM.png',
]

// API роуты, которые не требуют аутентификации
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/auth/callback',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/error',
  '/api/auth/providers',
  '/api/auth/verify-request',
  '/api/auth/reset-password',
  '/api/upload',
  '/api/tasks/events',
  '/api/tasks/poll',
  '/api/tasks/changes',
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
  return PUBLIC_API_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
}

// Проверка, является ли роут защищенным
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

// Проверка, является ли запрос API
function isApiRequest(pathname: string): boolean {
  return pathname.startsWith('/api/')
}

// Проверка аутентификации
async function checkAuth(request: NextRequest): Promise<boolean> {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      return false
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    return !!token
  } catch (error) {
    return false
  }
}

// Создание плавного редиректа
function createSmoothRedirect(url: string, request: NextRequest): NextResponse {
  const redirectUrl = new URL(url, request.url)
  
  // Добавляем callbackUrl для возврата после авторизации
  if (url.startsWith('/auth/login')) {
    redirectUrl.searchParams.set('callbackUrl', request.url)
  }
  
  return NextResponse.redirect(redirectUrl)
}

// Добавление security заголовков
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

// Добавление CORS заголовков
function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')
  
  if (origin && (
    origin === 'http://localhost:3000' ||
    origin === 'http://127.0.0.1:3000' ||
    origin === 'http://172.16.10.245:3000' ||
    origin === 'https://portal-arm.vercel.app'
  )) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
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
    
    // Для SSE и polling роутов не проверяем аутентификацию
    if (pathname === '/api/tasks/events' || pathname === '/api/tasks/poll') {
      return response
    }
    
    // Проверяем аутентификацию только для защищенных API роутов
    if (!isPublicApiRoute(pathname)) {
      const isAuthenticated = await checkAuth(request)
      
      if (!isAuthenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    
    // Главная страница - редирект на dashboard для авторизованных пользователей
    if (pathname === '/') {
      const isAuthenticated = await checkAuth(request)
      
      if (isAuthenticated) {
        return createSmoothRedirect('/dashboard', request)
      } else {
        return createSmoothRedirect('/auth/login', request)
      }
    }
    
    // Проверяем аутентификацию для защищенных роутов
    if (isProtectedRoute(pathname)) {
      const isAuthenticated = await checkAuth(request)
      
      if (!isAuthenticated) {
        return createSmoothRedirect('/auth/login', request)
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
    '/((?!_next/static|_next/image|favicon.ico|_vercel|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
} 