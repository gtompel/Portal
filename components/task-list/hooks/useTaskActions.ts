"use client"

import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Task, TaskFormData } from "../types"
import { getInitials } from "../utils"
import { createTask as createTaskAction, updateTask as updateTaskAction, deleteTask as deleteTaskAction, archiveTask as archiveTaskAction, restoreTask as restoreTaskAction, updateTaskStatus as updateTaskStatusAction } from "@/lib/actions"

export function useTaskActions(setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [isDeletingTask, setIsDeletingTask] = useState(false)

  // Создание задачи с Server Action
  const createTask = useCallback(async (data: TaskFormData) => {
    if (!session?.user?.id) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания настроек АРМ",
        variant: "destructive",
      })
      return
    }

    setIsAddingTask(true)

    try {
      // Создаем FormData для Server Action
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description || '')
      formData.append('status', data.status)
      formData.append('priority', data.priority)
      formData.append('networkType', data.networkType)
      formData.append('assigneeId', data.assigneeId || '')
      if (data.dueDate) {
        formData.append('dueDate', data.dueDate)
      }

      const result = await createTaskAction(formData)
      
      if (result.success && result.task) {
        const formattedTask: Task = {
          id: result.task.id,
          title: result.task.title,
          description: result.task.description,
          assignee: result.task.assignee
            ? {
                id: result.task.assignee.id,
                name: result.task.assignee.name,
                avatar: result.task.assignee.avatar,
                initials: result.task.assignee.initials || getInitials(result.task.assignee.name),
              }
            : null,
          status: result.task.status,
          priority: result.task.priority,
          networkType: result.task.networkType,
          dueDate: result.task.dueDate,
          createdAt: result.task.createdAt,
          taskNumber: result.task.taskNumber,
          isArchived: result.task.isArchived || false,
          creator: result.task.creator,
        }

        setTasks((prev) => [formattedTask, ...prev])

        toast({
          title: "Успешно",
          description: "Настройка АРМ успешно создана",
        })

        return true
      } else {
        throw new Error(result.error || "Не удалось создать настройку АРМ")
      }
    } catch (err) {
      console.error("Ошибка при создании настройки АРМ:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось создать настройку АРМ",
        variant: "destructive",
      })
      return false
    } finally {
      setIsAddingTask(false)
    }
  }, [session?.user?.id, setTasks, toast])

  // Обновление задачи с Server Action
  const updateTask = useCallback(async (taskId: string, data: TaskFormData) => {
    setIsEditingTask(true)

    try {
      // Создаем FormData для Server Action
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description || '')
      formData.append('status', data.status)
      formData.append('priority', data.priority)
      formData.append('networkType', data.networkType)
      formData.append('assigneeId', data.assigneeId || '')
      if (data.dueDate) {
        formData.append('dueDate', data.dueDate)
      }

      const result = await updateTaskAction(taskId, formData)
      
      if (result.success && result.task) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  title: result.task.title,
                  description: result.task.description,
                  assignee: result.task.assignee
                    ? {
                        id: result.task.assignee.id,
                        name: result.task.assignee.name,
                        avatar: result.task.assignee.avatar,
                        initials: result.task.assignee.initials || getInitials(result.task.assignee.name),
                      }
                    : null,
                  status: result.task.status,
                  priority: result.task.priority,
                  networkType: result.task.networkType,
                  dueDate: result.task.dueDate,
                }
              : task,
          ),
        )

        toast({
          title: "Успешно",
          description: "Настройка АРМ успешно обновлена",
        })

        return true
      } else {
        throw new Error(result.error || "Не удалось обновить настройку АРМ")
      }
    } catch (err) {
      console.error("Ошибка при обновлении настройки АРМ:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить настройку АРМ",
        variant: "destructive",
      })
      return false
    } finally {
      setIsEditingTask(false)
    }
  }, [setTasks, toast])

  // Удаление задачи с Server Action
  const deleteTask = useCallback(async (taskId: string) => {
    setIsDeletingTask(true)

    try {
      const result = await deleteTaskAction(taskId)
      
      if (result.success) {
        setTasks((prev) => prev.filter((task) => task.id !== taskId))

        toast({
          title: "Успешно",
          description: "Настройка АРМ успешно удалена",
        })

        return true
      } else {
        throw new Error(result.error || "Не удалось удалить настройку АРМ")
      }
    } catch (err) {
      console.error("Ошибка при удалении настройки АРМ:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить настройку АРМ",
        variant: "destructive",
      })
      return false
    } finally {
      setIsDeletingTask(false)
    }
  }, [setTasks, toast])

  // Быстрое обновление статуса с Server Action
  const quickUpdateStatus = useCallback(async (taskId: string, newStatus: Task["status"]) => {
    try {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      )

      const result = await updateTaskStatusAction(taskId, newStatus)
      
      if (result.success) {
        toast({
          title: "Статус обновлен",
          description: `Статус изменен на "${newStatus}"`,
        })

        return true
      } else {
        throw new Error(result.error || "Не удалось обновить статус")
      }
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive",
      })
      return false
    }
  }, [setTasks, toast])

  // Быстрое обновление приоритета
  const quickUpdatePriority = useCallback(async (taskId: string, newPriority: Task["priority"]) => {
    try {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, priority: newPriority } : task
        )
      )

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priority: newPriority,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось обновить приоритет")
      }

      const updatedTask = await response.json()
      setTasks((prev) => prev.map((task) => task.id === taskId ? updatedTask : task))

      toast({
        title: "Приоритет обновлен",
        description: `Приоритет изменен на "${newPriority}"`,
      })

      return true
    } catch (error) {
      console.error("Ошибка при обновлении приоритета:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить приоритет",
        variant: "destructive",
      })
      return false
    }
  }, [setTasks, toast])

  // Быстрое обновление типа сети
  const quickUpdateNetworkType = useCallback(async (taskId: string, newNetworkType: Task["networkType"]) => {
    try {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, networkType: newNetworkType } : task
        )
      )

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          networkType: newNetworkType,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось обновить тип сети")
      }

      const updatedTask = await response.json()
      setTasks((prev) => prev.map((task) => task.id === taskId ? updatedTask : task))

      toast({
        title: "Тип сети обновлен",
        description: `Тип сети изменен на "${newNetworkType}"`,
      })

      return true
    } catch (error) {
      console.error("Ошибка при обновлении типа сети:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить тип сети",
        variant: "destructive",
      })
      return false
    }
  }, [setTasks, toast])

  // Быстрое обновление исполнителя
  const quickUpdateAssignee = useCallback(async (taskId: string, newAssigneeId: string, users: any[]) => {
    try {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task
          if (newAssigneeId === "not_assigned") {
            return { ...task, assignee: null }
          }
          const user = users.find((u) => u.id === newAssigneeId)
          if (!user) return { ...task, assignee: null }
          return {
            ...task,
            assignee: {
              id: user.id,
              name: user.name,
              avatar: (task.assignee && task.assignee.id === user.id) ? task.assignee.avatar : null,
              initials: getInitials(user.name),
            },
          }
        })
      )

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: newAssigneeId === "not_assigned" ? null : newAssigneeId }),
      })

      if (!response.ok) throw new Error("Не удалось обновить исполнителя")

      const updatedTask = await response.json()
      setTasks((prev) => prev.map((task) => task.id === taskId ? updatedTask : task))

      toast({ title: "Исполнитель обновлен", description: `Исполнитель изменен` })

      return true
    } catch (error) {
      console.error("Ошибка при обновлении исполнителя:", error)
      toast({ title: "Ошибка", description: "Не удалось обновить исполнителя", variant: "destructive" })
      return false
    }
  }, [setTasks, toast])

  // Быстрое обновление типа дня
  const quickUpdateDayType = useCallback(async (taskId: string, newDayType: 'WEEKDAY' | 'WEEKEND' | null) => {
    try {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, dayType: newDayType || undefined } : task
        )
      )

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayType: newDayType })
      })

      if (!response.ok) throw new Error("Не удалось обновить день")

      const updatedTask = await response.json()
      setTasks((prev) => prev.map((task) => task.id === taskId ? updatedTask : task))

      toast({ title: "День обновлён", description: newDayType === 'WEEKEND' ? 'Выходной' : newDayType === 'WEEKDAY' ? 'Будни' : '—' })
      return true
    } catch (error) {
      console.error("Ошибка при обновлении дня:", error)
      toast({ title: "Ошибка", description: "Не удалось обновить день", variant: "destructive" })
      return false
    }
  }, [setTasks, toast])

  // Архивирование задачи с Server Action
  const archiveTask = useCallback(async (taskId: string) => {
    try {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, isArchived: true } : task
        )
      )

      const result = await archiveTaskAction(taskId)
      
      if (result.success) {
        toast({
          title: "Задача архивирована",
          description: "Задача успешно перемещена в архив",
        })

        return true
      } else {
        throw new Error(result.error || "Не удалось архивировать задачу")
      }
    } catch (error) {
      console.error("Ошибка при архивировании задачи:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать задачу",
        variant: "destructive",
      })
      return false
    }
  }, [setTasks, toast])

  // Восстановление задачи с Server Action
  const restoreTask = useCallback(async (taskId: string) => {
    try {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, isArchived: false } : task
        )
      )

      const result = await restoreTaskAction(taskId)
      
      if (result.success) {
        toast({
          title: "Задача восстановлена",
          description: "Задача успешно восстановлена из архива",
        })

        return true
      } else {
        throw new Error(result.error || "Не удалось восстановить задачу")
      }
    } catch (error) {
      console.error("Ошибка при восстановлении задачи:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось восстановить задачу",
        variant: "destructive",
      })
      return false
    }
  }, [setTasks, toast])

  return {
    isAddingTask,
    isEditingTask,
    isDeletingTask,
    createTask,
    updateTask,
    deleteTask,
    quickUpdateStatus,
    quickUpdatePriority,
    quickUpdateNetworkType,
    quickUpdateAssignee,
    quickUpdateDayType,
    archiveTask,
    restoreTask
  }
} 