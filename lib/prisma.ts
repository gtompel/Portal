import { PrismaClient } from "@prisma/client"

// Предотвращаем создание множества экземпляров PrismaClient в режиме разработки
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
})

// Добавляем Prisma Optimize только в продакшене для избежания проблем с OpenTelemetry в разработке
if (process.env.NODE_ENV === 'production' && process.env.OPTIMIZE_API_KEY) {
  import('@prisma/extension-optimize').then(({ withOptimize }) => {
    prisma.$extends(
      withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY! })
    )
  })
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma

