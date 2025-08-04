'use server'

import { prisma } from './prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { revalidatePath } from 'next/cache'
import { TaskStatus, TaskPriority, NetworkType } from '@prisma/client'

// Server Action для создания задачи
export async function createTask(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as string
  const priority = formData.get('priority') as string
  const networkType = formData.get('networkType') as string
  const assigneeId = formData.get('assigneeId') as string
  const dueDate = formData.get('dueDate') as string

  try {
    // Проверяем, существует ли пользователь по email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })
    
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Получаем максимальный номер задачи
    const maxTask = await prisma.task.aggregate({
      where: { isArchived: false },
      _max: { taskNumber: true }
    })
    
    const newTaskNumber = (maxTask._max.taskNumber || 0) + 1

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: (status as TaskStatus) || 'NEW',
        priority: (priority as TaskPriority) || 'MEDIUM',
        networkType: (networkType as NetworkType) || 'INTERNET',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId && assigneeId.trim() !== "" && assigneeId !== "not_assigned" ? assigneeId : null,
        creatorId: user.id,
        taskNumber: newTaskNumber
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    revalidatePath('/tasks')
    return { success: true, task }
  } catch (error) {
    console.error('Error creating task:', error)
    return { success: false, error: 'Failed to create task' }
  }
}

// Server Action для обновления задачи
export async function updateTask(taskId: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as string
  const priority = formData.get('priority') as string
  const networkType = formData.get('networkType') as string
  const assigneeId = formData.get('assigneeId') as string
  const dueDate = formData.get('dueDate') as string

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        networkType: networkType as NetworkType,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId && assigneeId.trim() !== "" ? assigneeId : null
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    revalidatePath('/tasks')
    return { success: true, task }
  } catch (error) {
    console.error('Error updating task:', error)
    return { success: false, error: 'Failed to update task' }
  }
}

// Server Action для удаления задачи
export async function deleteTask(taskId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  try {
    await prisma.task.delete({
      where: { id: taskId }
    })

    revalidatePath('/tasks')
    return { success: true }
  } catch (error) {
    console.error('Error deleting task:', error)
    return { success: false, error: 'Failed to delete task' }
  }
}

// Server Action для быстрого обновления статуса
export async function updateTaskStatus(taskId: string, status: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: status as TaskStatus }
    })

    revalidatePath('/tasks')
    return { success: true }
  } catch (error) {
    console.error('Error updating task status:', error)
    return { success: false, error: 'Failed to update task status' }
  }
}

// Server Action для архивирования задачи
export async function archiveTask(taskId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { isArchived: true }
    })

    revalidatePath('/tasks')
    return { success: true }
  } catch (error) {
    console.error('Error archiving task:', error)
    return { success: false, error: 'Failed to archive task' }
  }
}

// Server Action для восстановления задачи
export async function restoreTask(taskId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { isArchived: false }
    })

    revalidatePath('/tasks')
    return { success: true }
  } catch (error) {
    console.error('Error restoring task:', error)
    return { success: false, error: 'Failed to restore task' }
  }
} 