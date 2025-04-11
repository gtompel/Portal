import { PrismaClient } from "@prisma/client"

// Предотвращаем создание множества экземпляров PrismaClient в режиме разработки
const globalForPrisma = global as unknown as { prisma: PrismaClient }
log: ['query', 'info', 'warn', 'error']

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma

