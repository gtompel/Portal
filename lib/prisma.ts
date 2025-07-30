import { PrismaClient } from "@prisma/client"

// Предотвращаем создание множества экземпляров PrismaClient в режиме разработки
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
})

// Prisma Optimize отключен из-за конфликтов с NextAuth
// if (process.env.NODE_ENV === 'development' && process.env.OPTIMIZE_API_KEY) {
//   import('@prisma/extension-optimize').then(({ withOptimize }) => {
//     const extendedPrisma = prisma.$extends(
//       withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY! })
//     )
//     // Присваиваем методы расширенного клиента
//     Object.setPrototypeOf(prisma, Object.getPrototypeOf(extendedPrisma))
//     Object.assign(prisma, extendedPrisma)
//   })
// }

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma

