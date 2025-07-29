import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lastCheck = searchParams.get('lastCheck') // Время последней проверки

    // Получаем задачи, измененные после lastCheck
    const whereClause: any = {
      isArchived: false
    }

    if (lastCheck) {
      whereClause.updatedAt = {
        gt: new Date(parseInt(lastCheck))
      }
    }

    const changedTasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10 // Ограничиваем количество
    })

    // Получаем количество новых задач
    const newTasksCount = await prisma.task.count({
      where: {
        isArchived: false,
        createdAt: lastCheck ? {
          gt: new Date(parseInt(lastCheck))
        } : undefined
      }
    })

    return NextResponse.json({
      type: 'changes',
      timestamp: Date.now(),
      userId: token.sub,
      changedTasks,
      newTasksCount,
      hasChanges: changedTasks.length > 0 || newTasksCount > 0
    })
  } catch (error) {
    console.error('Changes API error:', error)
    return NextResponse.json({ error: 'Changes Error' }, { status: 500 })
  }
} 