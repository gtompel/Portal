import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Task, TaskFormData } from "../types"
import { getInitials } from "../utils"

export function useTaskActions(setTasks: React.Dispatch<React.SetStateAction<Task[]>>) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [isDeletingTask, setIsDeletingTask] = useState(false)

  // Создание задачи
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
      const assigneeId = data.assigneeId === "" || data.assigneeId === "not_assigned" ? null : data.assigneeId

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          assigneeId,
          creatorId: session.user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось создать настройку АРМ")
      }

      const newTask = await response.json()

      const formattedTask: Task = {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        assignee: newTask.assignee
          ? {
              id: newTask.assignee.id,
              name: newTask.assignee.name,
              avatar: newTask.assignee.avatar,
              initials: newTask.assignee.initials || getInitials(newTask.assignee.name),
            }
          : null,
        status: newTask.status,
        priority: newTask.priority,
        networkType: newTask.networkType,
        dueDate: newTask.dueDate,
        createdAt: newTask.createdAt,
        taskNumber: newTask.taskNumber,
        isArchived: newTask.isArchived || false,
      }

      setTasks((prev) => [formattedTask, ...prev])

      toast({
        title: "Успешно",
        description: "Настройка АРМ успешно создана",
      })

      return true
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

  // Обновление задачи
  const updateTask = useCallback(async (taskId: string, data: TaskFormData) => {
    setIsEditingTask(true)

    try {
      const assigneeId = data.assigneeId === "not_assigned" ? null : data.assigneeId

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          assigneeId,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось обновить настройку АРМ")
      }

      const updatedTask = await response.json()

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                title: updatedTask.title,
                description: updatedTask.description,
                assignee: updatedTask.assignee
                  ? {
                      id: updatedTask.assignee.id,
                      name: updatedTask.assignee.name,
                      avatar: updatedTask.assignee.avatar,
                      initials: updatedTask.assignee.initials || getInitials(updatedTask.assignee.name),
                    }
                  : null,
                status: updatedTask.status,
                priority: updatedTask.priority,
                networkType: updatedTask.networkType,
                dueDate: updatedTask.dueDate,
              }
            : task,
        ),
      )

      toast({
        title: "Успешно",
        description: "Настройка АРМ успешно обновлена",
      })

      return true
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

  // Удаление задачи
  const deleteTask = useCallback(async (taskId: string) => {
    setIsDeletingTask(true)

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить настройку АРМ")
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId))

      toast({
        title: "Успешно",
        description: "Настройка АРМ успешно удалена",
      })

      return true
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

  // Быстрое обновление статуса
  const quickUpdateStatus = useCallback(async (taskId: string, newStatus: Task["status"]) => {
    try {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      )

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось обновить статус")
      }

      const updatedTask = await response.json()
      setTasks((prev) => prev.map((task) => task.id === taskId ? updatedTask : task))

      toast({
        title: "Статус обновлен",
        description: `Статус изменен на "${newStatus}"`,
      })

      return true
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
              avatar: (task.assignee && task.assignee.id === user.id) ? task.assignee.avatar : undefined,
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

  // Архивирование задачи
  const archiveTask = useCallback(async (taskId: string) => {
    try {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, isArchived: true } : task
        )
      )

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isArchived: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось архивировать задачу")
      }

      const updatedTask = await response.json()
      setTasks((prev) => prev.map((task) => task.id === taskId ? updatedTask : task))

      toast({
        title: "Задача архивирована",
        description: "Задача успешно перемещена в архив",
      })

      return true
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

  // Восстановление задачи
  const restoreTask = useCallback(async (taskId: string) => {
    try {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, isArchived: false } : task
        )
      )

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isArchived: false,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось восстановить задачу")
      }

      const updatedTask = await response.json()
      setTasks((prev) => prev.map((task) => task.id === taskId ? updatedTask : task))

      toast({
        title: "Задача восстановлена",
        description: "Задача успешно восстановлена из архива",
      })

      return true
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
    archiveTask,
    restoreTask
  }
} 