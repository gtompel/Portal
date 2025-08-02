# Оптимизация архитектуры Next.js 15

## Обзор

Проект использует современную архитектуру Next.js 15 с Server Components и Server Actions для максимальной производительности и простоты разработки.

## Архитектурные решения

### Почему не GraphQL?

1. **Server Components** уже оптимизируют запросы - данные загружаются на сервере
2. **Server Actions** предоставляют прямой доступ к серверной логике
3. **REST API** проще в понимании и отладке
4. **Меньше сложности** - нет необходимости в схеме, резолверах, клиенте

### Рекомендуемая архитектура

#### 1. Server Components для статических данных

```typescript
// app/tasks/page.tsx
import { prisma } from '@/lib/prisma'

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    where: { isArchived: false },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
}
```

#### 2. Server Actions для мутаций

```typescript
// lib/actions.ts
'use server'

import { prisma } from './prisma'
import { revalidatePath } from 'next/cache'

export async function createTask(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const task = await prisma.task.create({
    data: {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      creatorId: session.user.id
    }
  })

  revalidatePath('/tasks')
  return { success: true, task }
}
```

#### 3. Client Components только для интерактивности

```typescript
'use client'

import { createTask } from '@/lib/actions'

export function TaskForm() {
  return (
    <form action={createTask}>
      <input name="title" placeholder="Название задачи" />
      <textarea name="description" placeholder="Описание" />
      <button type="submit">Создать задачу</button>
    </form>
  )
}
```

#### 4. API Routes для сложных запросов

```typescript
// app/api/tasks/search/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    }
  })
  
  return NextResponse.json(tasks)
}
```

## Преимущества текущей архитектуры

### 1. Производительность

- **Server Components** - рендеринг на сервере без JavaScript
- **Streaming** - постепенная загрузка компонентов
- **Caching** - автоматическое кэширование на сервере
- **Bundle Size** - меньше JavaScript на клиенте

### 2. Разработка

- **TypeScript** - полная типизация
- **Prisma** - типобезопасные запросы к БД
- **NextAuth** - простая аутентификация
- **Tailwind CSS** - быстрая стилизация

### 3. SEO и доступность

- **Server-side rendering** - лучший SEO
- **Progressive enhancement** - работает без JavaScript
- **Accessibility** - встроенная поддержка

## Оптимизации

### 1. Кэширование данных

```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache'

export const getCachedTasks = unstable_cache(
  async () => {
    return await prisma.task.findMany({
      where: { isArchived: false },
      include: { assignee: true, creator: true }
    })
  },
  ['tasks'],
  { revalidate: 60 } // Обновление каждую минуту
)
```

### 2. Параллельные запросы

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const [tasks, users, analytics] = await Promise.all([
    prisma.task.findMany(),
    prisma.user.findMany(),
    prisma.task.groupBy({ by: ['status'], _count: true })
  ])

  return (
    <div>
      <TaskList tasks={tasks} />
      <UserList users={users} />
      <Analytics data={analytics} />
    </div>
  )
}
```

### 3. Оптимистичные обновления

```typescript
'use client'

import { useOptimistic } from 'react'
import { updateTaskStatus } from '@/lib/actions'

export function TaskStatusButton({ task, newStatus }) {
  const [optimisticTask, updateOptimisticTask] = useOptimistic(
    task,
    (state, newStatus) => ({ ...state, status: newStatus })
  )

  const handleClick = async () => {
    updateOptimisticTask(newStatus)
    await updateTaskStatus(task.id, newStatus)
  }

  return (
    <button onClick={handleClick}>
      {optimisticTask.status}
    </button>
  )
}
```

## Мониторинг и отладка

### 1. Логирование

```typescript
// lib/logger.ts
export function logServerAction(action: string, data: any) {
  console.log(`[Server Action] ${action}:`, data)
}
```

### 2. Обработка ошибок

```typescript
// lib/error-boundary.tsx
'use client'

export function ErrorBoundary({ error, reset }: { error: Error, reset: () => void }) {
  return (
    <div>
      <h2>Что-то пошло не так!</h2>
      <button onClick={reset}>Попробовать снова</button>
    </div>
  )
}
```

### 3. Метрики производительности

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const start = Date.now()
  
  const response = NextResponse.next()
  
  const duration = Date.now() - start
  console.log(`${request.method} ${request.url} - ${duration}ms`)
  
  return response
}
```

## Заключение

Текущая архитектура с Server Components и Server Actions обеспечивает:

1. **Лучшую производительность** - меньше JavaScript, больше серверного рендеринга
2. **Простоту разработки** - меньше абстракций, больше прямого доступа
3. **Лучший UX** - быстрая загрузка, оптимистичные обновления
4. **SEO оптимизацию** - серверный рендеринг для поисковых систем

GraphQL был бы избыточен в данном контексте и добавил бы ненужную сложность. 