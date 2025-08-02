# ГАиОАРМ - Портал автоматизированных рабочих мест

Веб-приложение для управления настройками автоматизированных рабочих мест (АРМ) с системой уведомлений, управления задачами и пользователями.

## 🚀 Технологии

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, Server Actions, Prisma ORM
- **База данных**: PostgreSQL
- **Аутентификация**: NextAuth.js
- **Стилизация**: Tailwind CSS, shadcn/ui
- **Реальное время**: Server-Sent Events (SSE)
- **Загрузка файлов**: Multer (через API Routes)
- **Архитектура**: Server Components, Server Actions, REST API

## 📁 Структура проекта

```
Portal/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints
│   ├── auth/                     # Страницы аутентификации
│   ├── employees/                # Управление сотрудниками
│   ├── settings/                 # Настройки профиля
│   ├── tasks/                    # Управление задачами
│   └── ...
├── components/                   # React компоненты
│   ├── ui/                       # UI компоненты (shadcn/ui)
│   └── ...
├── lib/                          # Утилиты и конфигурации
├── prisma/                       # Схема базы данных
├── hooks/                        # React хуки
├── types/                        # TypeScript типы
└── public/                       # Статические файлы
    └── uploads/                  # Загруженные файлы
```

## 🔐 Аутентификация

### Страницы аутентификации
- `/auth/login` - Вход в систему
- `/auth/register` - Регистрация
- `/auth/forgot-password` - Восстановление пароля
- `/auth/reset-password` - Сброс пароля

### API аутентификации
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/forgot-password` - Запрос сброса пароля
- `POST /api/auth/reset-password` - Сброс пароля
- `GET /api/auth/status` - Статус аутентификации

## 👥 Управление пользователями

### API пользователей
- `GET /api/users` - Получить всех пользователей
- `GET /api/users/[id]` - Получить пользователя по ID
- `PUT /api/users/[id]` - Обновить пользователя
- `DELETE /api/users/[id]` - Удалить пользователя

### Поля пользователя (Prisma Schema)
```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String
  position      String
  department    String
  phone         String?
  avatar        String?
  initials      String
  status        UserStatus @default(WORKING)
  location      String?
  hireDate      DateTime
  birthday      DateTime?
  bio           String?
  manager       User?      @relation("UserToManager")
  managerId     String?
  subordinates  User[]     @relation("UserToManager")
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}
```

## 📋 Управление задачами (АРМ)

### API задач
- `GET /api/tasks` - Получить все задачи
- `POST /api/tasks` - Создать новую задачу
- `GET /api/tasks/[id]` - Получить задачу по ID
- `PUT /api/tasks/[id]` - Обновить задачу
- `DELETE /api/tasks/[id]` - Удалить задачу
- `GET /api/tasks/events` - SSE для реального времени
- `GET /api/tasks/poll` - Polling для изменений
- `GET /api/tasks/changes` - Проверка изменений

### Поля задачи
```prisma
model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(NEW)
  priority    TaskPriority @default(LOW)
  networkType NetworkType @default(EMVS)
  dueDate     DateTime?
  assignee    User?     @relation("AssignedTasks")
  assigneeId  String?
  creator     User      @relation("CreatedTasks")
  creatorId   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  isArchived  Boolean   @default(false)
  taskNumber  Int?
}
```

### Статусы задач
- `NEW` - Новый
- `IN_PROGRESS` - Идёт настройка
- `REVIEW` - Готов
- `COMPLETED` - Выдан

### Приоритеты
- `LOW` - Низкий
- `MEDIUM` - Средний
- `HIGH` - Высокий

### Типы сети
- `EMVS` - ЕМВС
- `INTERNET` - Интернет
- `ASZI` - АСЗИ

## 📁 Загрузка файлов

### API загрузки
- `POST /api/upload` - Загрузка файлов (аватары, документы)

### Поддерживаемые форматы
- **Изображения**: JPEG, PNG, GIF, WebP
- **Документы**: DOC, DOCX, PDF, TXT
- **Максимальный размер**: 5MB

### Структура загруженных файлов
```
public/uploads/
├── [uuid].jpg      # Аватары пользователей
├── [uuid].png      # Изображения
├── [uuid].gif      # GIF анимации
└── [uuid].pdf      # Документы
```

## 📢 Уведомления

### API уведомлений
- `GET /api/notifications` - Получить уведомления
- `POST /api/notifications/mark-read` - Отметить как прочитанное
- `POST /api/notifications/migrate` - Миграция уведомлений

### Типы уведомлений
- `EVENT` - События
- `TASK` - Задачи
- `MESSAGE` - Сообщения
- `ANNOUNCEMENT` - Объявления

## 📅 События и календарь

### API событий
- `GET /api/events` - Получить все события
- `POST /api/events` - Создать событие
- `GET /api/events/[id]` - Получить событие
- `PUT /api/events/[id]` - Обновить событие
- `DELETE /api/events/[id]` - Удалить событие
- `GET /api/events/[id]/participants` - Участники события

### Типы событий
- `MEETING` - Встреча
- `DEADLINE` - Дедлайн
- `HOLIDAY` - Праздник
- `VACATION` - Отпуск

## 📊 Аналитика

### API аналитики
- `GET /api/analytics` - Общая аналитика
- `GET /api/analytics/performance` - Производительность
- `GET /api/analytics/projects` - Аналитика проектов
- `GET /api/analytics/tasks` - Аналитика задач

## 📄 Документы

### API документов
- `GET /api/documents` - Получить все документы
- `POST /api/documents` - Создать документ
- `GET /api/documents/[id]` - Получить документ
- `PUT /api/documents/[id]` - Обновить документ
- `DELETE /api/documents/[id]` - Удалить документ

## 💬 Сообщения

### API сообщений
- `GET /api/messages` - Получить сообщения
- `POST /api/messages` - Отправить сообщение
- `GET /api/messages/[id]` - Получить сообщение
- `PUT /api/messages/[id]` - Обновить сообщение
- `DELETE /api/messages/[id]` - Удалить сообщение

## 📢 Объявления

### API объявлений
- `GET /api/announcements` - Получить объявления
- `POST /api/announcements` - Создать объявление
- `GET /api/announcements/[id]` - Получить объявление
- `PUT /api/announcements/[id]` - Обновить объявление
- `DELETE /api/announcements/[id]` - Удалить объявление
- `POST /api/announcements/[id]/like` - Лайк объявления
- `GET /api/announcements/[id]/comments` - Комментарии
- `POST /api/announcements/[id]/comments` - Добавить комментарий

## 🏗️ Проекты

### API проектов
- `GET /api/projects` - Получить все проекты
- `POST /api/projects` - Создать проект
- `GET /api/projects/[id]` - Получить проект
- `PUT /api/projects/[id]` - Обновить проект
- `DELETE /api/projects/[id]` - Удалить проект
- `GET /api/projects/[id]/members` - Участники проекта
- `POST /api/projects/[id]/members` - Добавить участника
- `DELETE /api/projects/[id]/members/[memberId]` - Удалить участника

## 🔧 Настройки и конфигурация

### Файлы конфигурации
- `next.config.mjs` - Конфигурация Next.js
- `tailwind.config.ts` - Конфигурация Tailwind CSS
- `prisma/schema.prisma` - Схема базы данных
- `middleware.ts` - Middleware для аутентификации и CORS
- `lib/actions.ts` - Server Actions для мутаций данных

### Переменные окружения (.env)
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 🚀 Запуск проекта

### Установка зависимостей
```bash
npm install
```

### Настройка базы данных
```bash
npx prisma generate
npx prisma db push
```

### Запуск в режиме разработки
```bash
npm run dev
```

### Сборка для продакшена
```bash
npm run build
npm start
```

## 📱 Основные страницы

### Архитектурные решения

Проект использует современную архитектуру Next.js 15:

- **Server Components** - для статических данных и SEO-оптимизации
- **Server Actions** - для мутаций данных без дополнительных API endpoints
- **REST API** - для сложных запросов и интерактивных компонентов
- **SSE** - для real-time обновлений

Подробная документация по архитектуре: [docs/ARCHITECTURE_OPTIMIZATION.md](docs/ARCHITECTURE_OPTIMIZATION.md)

### Публичные страницы
- `/` - Главная страница
- `/auth/login` - Вход
- `/auth/register` - Регистрация
- `/auth/forgot-password` - Восстановление пароля

### Защищенные страницы
- `/tasks` - Управление задачами АРМ
- `/employees` - Сотрудники
- `/projects` - Проекты
- `/documents` - Документы
- `/messages` - Сообщения
- `/calendar` - Календарь событий
- `/analytics` - Аналитика
- `/announcements` - Объявления
- `/settings` - Настройки профиля
- `/help` - Справка

### Тестирование
- Отладочные логи в консоли
- Проверка API endpoints

## 🔒 Безопасность

### Middleware
- Аутентификация для защищенных маршрутов
- CORS настройки
- Rate limiting
- Логирование запросов

### Валидация
- Проверка типов файлов
- Ограничение размера файлов
- Валидация входных данных

## 📊 База данных

### Основные модели
- `User` - Пользователи
- `Task` - Задачи АРМ
- `Event` - События
- `Message` - Сообщения
- `Document` - Документы
- `Project` - Проекты
- `Announcement` - Объявления
- `Notification` - Уведомления

### Связи
- Каскадное удаление для связанных записей
- Внешние ключи с проверкой целостности
- Оптимизированные индексы

## 🎨 UI/UX

### Компоненты
- **shadcn/ui** - Базовая библиотека компонентов
- **Tailwind CSS** - Утилитарные классы
- **Lucide React** - Иконки
- **React Hook Form** - Формы
- **Zod** - Валидация схем

### Особенности
- Темная тема
- Адаптивный дизайн
- Анимации и переходы
- Модальные окна
- Toast уведомления

## 🔄 Реальное время

### Server-Sent Events (SSE)
- Обновления задач в реальном времени
- Уведомления о новых событиях
- Изменения статусов

### Polling (для Vercel)
- Альтернативный механизм для платформ без SSE
- Проверка изменений каждые 5 секунд

## 📈 Производительность

### Оптимизации
- Ленивая загрузка компонентов
- Оптимизация изображений
- Кэширование API запросов
- Индексы базы данных

### Мониторинг
- Логирование ошибок
- Метрики производительности
- Аналитика использования

## 🧪 Тестирование

### Тестирование
- Отладочные логи в консоли
- Проверка API endpoints
- Детальное логирование загрузки файлов

## 📚 Документация

### Техническая документация
- **[docs/README.md](docs/README.md)** - Индекс документации
- **[docs/middleware.md](docs/middleware.md)** - Middleware документация
- **[docs/MIDDLEWARE_SETUP.md](docs/MIDDLEWARE_SETUP.md)** - Быстрый старт middleware
- **[docs/UPLOAD_TROUBLESHOOTING.md](docs/UPLOAD_TROUBLESHOOTING.md)** - Решение проблем с загрузкой

## 📝 Лицензия

Проект разработан для внутреннего использования ГАиОАРМ.

## 👥 Команда разработки

- **Frontend**: React, Next.js, TypeScript
- **Backend**: Next.js API Routes, Prisma
- **База данных**: PostgreSQL
- **DevOps**: Vercel, GitHub

---

**Версия**: 1.0.0  
**Последнее обновление**: 2024  
**Статус**: В разработке 