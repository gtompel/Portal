"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { useSSE } from "@/hooks/use-sse"
import { Task, User } from "../types"
import { getInitials } from "../utils"

export function useTaskList() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // SSE для real-time обновлений
  const { isConnected: isSSEConnected } = useSSE('/api/tasks/events', {
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'task_created':
            if (data.task) {
              setTasks(prev => [data.task, ...prev])
              toast({
                title: "Новая задача",
                description: `Создана задача: ${data.task.title}`,
              })
            } else if (data.newTasksCount) {
              fetchTasks()
              toast({
                title: "Новые задачи",
                description: `Создано ${data.newTasksCount} новых задач`,
              })
            }
            break
            
          case 'task_updated':
          case 'task_status_changed':
          case 'task_priority_changed':
          case 'task_network_type_changed': {
            setTasks(prev => {
              const exists = prev.some(task => task.id === data.taskId)
              if (exists) {
                return prev.map(task => task.id === data.taskId ? data.task : task)
              }
              // Если задачи нет в текущем списке, но сервер прислал полную задачу — добавим
              if (data.task) {
                return [data.task, ...prev]
              }
              // Иначе перезагрузим список
              fetchTasks()
              return prev
            })
            toast({
              title: "Задача обновлена",
              description: `Задача "${data.task.title}" была изменена`,
            })
            break
          }
            
          case 'task_deleted':
            setTasks(prev => prev.filter(task => task.id !== data.taskId))
            toast({
              title: "Задача удалена",
              description: "Задача была удалена другим пользователем",
            })
            break
            
          case 'task_archived':
            setTasks(prev => prev.map(task => 
              task.id === data.taskId ? data.task : task
            ))
            toast({
              title: "Задача архивирована",
              description: `Задача "${data.task.title}" была архивирована`,
            })
            break
            
          case 'task_assigned': {
            // Всегда обновляем список, чтобы увидеть смену исполнителя
            if (data.taskId && data.task) {
              setTasks(prev => {
                const exists = prev.some(task => task.id === data.taskId)
                return exists
                  ? prev.map(task => task.id === data.taskId ? data.task : task)
                  : [data.task, ...prev]
              })
            } else {
              fetchTasks()
            }
            if (session?.user?.id && data.userId === session.user.id) {
              toast({
                title: 'Вам назначена задача',
                description: data.task?.title || '',
              })
            }
            break
          }
        }
      } catch (error) {
        console.error('Error processing SSE message:', error)
      }
    }
  })

  const fetchTasks = useCallback(async (showArchived: boolean = false) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tasks?showArchived=${showArchived}`)

      if (!response.ok) {
        throw new Error("Не удалось загрузить задачи")
      }

      const data = await response.json()

      const formattedTasks = data.map((item: any, index: number) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        assignee: item.assignee
          ? {
              id: item.assignee.id,
              name: item.assignee.name,
              avatar: item.assignee.avatar,
              initials: item.assignee.initials || getInitials(item.assignee.name),
            }
          : null,
        status: item.status,
        priority: item.priority,
        networkType: item.networkType,
        dayType: item.dayType,
        dueDate: item.dueDate,
        createdAt: item.createdAt,
        taskNumber: item.taskNumber,
        isArchived: item.isArchived || false,
      }))
      
      setTasks(formattedTasks)
    } catch (err) {
      setError("Не удалось загрузить задачи")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch("/api/users")

      if (!response.ok) {
        throw new Error("Не удалось загрузить пользователей")
      }

      const data = await response.json()

      const formattedUsers = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        initials: getInitials(item.name),
        avatar: item.avatar,
      }))

      setUsers(formattedUsers)
    } catch (err) {
      console.error("Ошибка при загрузке пользователей:", err)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    tasks,
    users,
    isLoading,
    isLoadingUsers,
    error,
    isSSEConnected,
    fetchTasks,
    setTasks,
    setError
  }
} 