import { PrismaClient } from "@prisma/client"

// Предотвращаем создание множества экземпляров PrismaClient в режиме разработки
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['warn', 'error']
})



if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma

