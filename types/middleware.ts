import { NextRequest, NextResponse } from 'next/server'

// Типы для middleware
export interface MiddlewareConfig {
  publicRoutes: string[]
  publicApiRoutes: string[]
  protectedRoutes: string[]
  securityHeaders: Record<string, string>
}

// Тип для функции проверки роута
export type RouteChecker = (pathname: string) => boolean

// Тип для функции обработки запроса
export type RequestHandler = (request: NextRequest) => Promise<NextResponse> | NextResponse

// Тип для функции добавления заголовков
export type HeaderHandler = (response: NextResponse) => NextResponse

// Расширенный тип для NextRequest с дополнительными свойствами
export interface ExtendedNextRequest extends NextRequest {
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

// Тип для конфигурации CORS
export interface CorsConfig {
  origin: string | string[]
  methods: string[]
  headers: string[]
  maxAge: number
  credentials: boolean
}

// Тип для конфигурации безопасности
export interface SecurityConfig {
  contentSecurityPolicy: string
  xFrameOptions: string
  xContentTypeOptions: string
  xXssProtection: string
  referrerPolicy: string
} 