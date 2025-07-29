# Middleware Documentation

## Обзор

Middleware в проекте реализован согласно лучшим практикам Next.js App Router и обеспечивает:

- 🔐 **Аутентификация** - защита роутов и API
- 🛡️ **Безопасность** - security headers, CORS, rate limiting
- 📊 **Логирование** - детальное логирование запросов
- ⚡ **Производительность** - оптимизированный matcher

## Структура файлов

```
├── middleware.ts              # Основной middleware файл
├── lib/middleware-utils.ts    # Утилиты для middleware
├── types/middleware.ts        # TypeScript типы
└── docs/middleware.md         # Документация
```

## Функциональность

### 1. Аутентификация

Middleware проверяет JWT токены для защищенных роутов:

- **Публичные роуты**: `/auth/*`, `/api/auth`, статические файлы
- **Защищенные роуты**: `/tasks`, `/projects`, `/employees`, etc.
- **API роуты**: требуют аутентификации, кроме `/api/auth` и `/api/upload`

### 2. Безопасность

#### Security Headers
```typescript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

#### CORS
- Настраивается через `corsConfig` в `middleware-utils.ts`
- Поддерживает credentials
- Разные настройки для development и production

#### Rate Limiting
- Базовый rate limiting по IP адресу
- 100 запросов за 15 минут по умолчанию
- Настраивается в `checkRateLimit` функции

### 3. Логирование

В development режиме логируется:
- Метод запроса
- URL
- IP адрес
- User Agent
- Timestamp

## Конфигурация

### Настройка CORS

```typescript
// lib/middleware-utils.ts
export const corsConfig: CorsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Замени на свой домен
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
  credentials: true
}
```

### Настройка Security Headers

```typescript
// lib/middleware-utils.ts
export const securityConfig: SecurityConfig = {
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; ...",
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  xXssProtection: '1; mode=block',
  referrerPolicy: 'strict-origin-when-cross-origin'
}
```

### Добавление новых роутов

```typescript
// middleware.ts
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/new-public-route', // Добавить здесь
]

const PROTECTED_ROUTES = [
  '/dashboard',
  '/new-protected-route', // Добавить здесь
]
```

## Утилиты

### Основные функции

- `checkAuth(request)` - проверка аутентификации
- `addCorsHeaders(response, request)` - добавление CORS заголовков
- `addSecurityHeaders(response)` - добавление security заголовков
- `logRequest(request, level)` - логирование запросов
- `checkRateLimit(ip, limit, windowMs)` - rate limiting
- `getClientIP(request)` - получение IP клиента

### Создание ответов

- `createErrorResponse(message, status)` - создание ошибки
- `createRedirectResponse(url, request)` - создание редиректа

## Производительность

### Matcher конфигурация

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

Исключает статические файлы для оптимизации производительности.

## Мониторинг

### Логи в Development

```
[2024-01-15T10:30:00.000Z] GET /tasks - IP: 127.0.0.1 - UA: Mozilla/5.0...
[2024-01-15T10:30:01.000Z] POST /api/tasks - IP: 127.0.0.1 - UA: Mozilla/5.0...
```

### Ошибки

- `401 Unauthorized` - неавторизованный доступ к защищенному роуту
- `429 Too Many Requests` - превышен лимит запросов

## Расширение

### Добавление новой функциональности

1. Создать функцию в `lib/middleware-utils.ts`
2. Добавить типы в `types/middleware.ts`
3. Интегрировать в `middleware.ts`
4. Обновить документацию

### Пример: Добавление кастомного заголовка

```typescript
// lib/middleware-utils.ts
export function addCustomHeader(response: NextResponse, value: string): NextResponse {
  response.headers.set('X-Custom-Header', value)
  return response
}

// middleware.ts
const response = NextResponse.next()
addCustomHeader(response, 'custom-value')
return response
```

## Troubleshooting

### Проблемы с CORS

1. Проверить настройки `corsConfig`
2. Убедиться, что домен добавлен в `origin`
3. Проверить заголовки в Network tab браузера

### Проблемы с аутентификацией

1. Проверить `NEXTAUTH_SECRET` в переменных окружения
2. Убедиться, что роут добавлен в правильный массив
3. Проверить JWT токен в cookies

### Проблемы с производительностью

1. Проверить matcher конфигурацию
2. Убедиться, что статические файлы исключены
3. Мониторить время выполнения middleware 