# Middleware Setup - Быстрый старт

## ✅ Что уже настроено

Middleware полностью интегрирован в проект и включает:

- 🔐 **Аутентификация** через NextAuth.js JWT
- 🛡️ **Security Headers** (CSP, XSS Protection, etc.)
- 🌐 **CORS** для API роутов
- 📊 **Логирование** запросов в development
- ⚡ **Rate Limiting** (100 запросов/15 мин)
- 🎯 **Оптимизированный matcher** для производительности

## 🚀 Готово к использованию

Middleware автоматически:
- Защищает все роуты `/tasks`, `/projects`, `/employees`, etc.
- Пропускает публичные роуты `/auth/*`, `/api/auth`
- Добавляет security headers ко всем ответам
- Логирует запросы в development режиме

## ⚙️ Настройка для Production

1. **Обновите CORS домены** в `lib/middleware-utils.ts`:
```typescript
origin: process.env.NODE_ENV === 'production' 
  ? ['https://yourdomain.com'] // Замените на ваш домен
  : ['http://localhost:3000', 'http://127.0.0.1:3000'],
```

2. **Проверьте переменные окружения**:
```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://yourdomain.com
```

## 📁 Структура файлов

```
├── middleware.ts              # Основной middleware
├── lib/middleware-utils.ts    # Утилиты и конфигурация
├── types/middleware.ts        # TypeScript типы
├── docs/middleware.md         # Полная документация
└── MIDDLEWARE_SETUP.md        # Этот файл
```

## 🔧 Добавление новых роутов

### Публичный роут:
```typescript
// middleware.ts
const PUBLIC_ROUTES = [
  '/auth/login',
  '/new-public-route', // Добавить здесь
]
```

### Защищенный роут:
```typescript
// middleware.ts
const PROTECTED_ROUTES = [
  '/dashboard',
  '/new-protected-route', // Добавить здесь
]
```

## 📊 Мониторинг

В development режиме в консоли отображаются:
```
[2024-01-15T10:30:00.000Z] GET /tasks - IP: 127.0.0.1 - UA: Mozilla/5.0...
```

## 🆘 Troubleshooting

### Ошибка 401 Unauthorized
- Проверьте `NEXTAUTH_SECRET` в `.env`
- Убедитесь, что роут добавлен в правильный массив

### Ошибка 429 Too Many Requests
- Увеличьте лимит в `checkRateLimit` функции
- Проверьте IP адрес в логах

### Проблемы с CORS
- Обновите `corsConfig.origin` в `middleware-utils.ts`
- Проверьте заголовки в Network tab браузера

## 📚 Дополнительная документация

Полная документация доступна в `docs/middleware.md` 