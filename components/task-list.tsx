"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Loader2, Edit, Trash, Check, Archive } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Типы данных
type Task = {
  id: string
  title: string
  description?: string
  assignee: {
    id: string
    name: string
    avatar?: string
    initials: string
  } | null
  status: "NEW" | "IN_PROGRESS" | "REVIEW" | "COMPLETED"
  priority: "LOW" | "MEDIUM" | "HIGH"
  networkType: "EMVS" | "INTERNET" | "ASZI"
  dueDate: string | null
  createdAt: string
  taskNumber?: number
  isArchived: boolean
}

type User = {
  id: string
  name: string
}

export function TaskList() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [networkTypeFilter, setNetworkTypeFilter] = useState<string>("all")
  const [showArchived, setShowArchived] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [isDeletingTask, setIsDeletingTask] = useState(false)

  // Форма создания/редактирования задачи
  const taskSchema = z.object({
    title: z.string().min(3, "Название должно содержать минимум 3 символа"),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
    status: z.enum(["NEW", "IN_PROGRESS", "REVIEW", "COMPLETED"]),
    networkType: z.enum(["EMVS", "INTERNET", "ASZI"]),
    dueDate: z.string().optional(),
    assigneeId: z.string().optional(),
  })

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "LOW",
      status: "NEW",
      networkType: "EMVS",
      dueDate: "",
      assigneeId: "",
    },
  })

  const editForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "LOW",
      status: "NEW",
      networkType: "EMVS",
      dueDate: "",
      assigneeId: "",
    },
  })

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [showArchived])

  useEffect(() => {
    if (tasks.length) {
      filterTasks()
    }
  }, [searchTerm, statusFilter, networkTypeFilter, tasks])

  useEffect(() => {
    if (currentTask) {
      // Заполняем форму редактирования данными текущей задачи
      editForm.reset({
        title: currentTask.title,
        description: currentTask.description || "",
        priority: currentTask.priority,
        status: currentTask.status,
        networkType: currentTask.networkType,
        dueDate: currentTask.dueDate || "",
        assigneeId: currentTask.assignee?.id || "",
      })
    }
  }, [currentTask, editForm])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/tasks?showArchived=${showArchived}`)

      if (!response.ok) {
        throw new Error("Не удалось загрузить задачи")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
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
        dueDate: item.dueDate,
        createdAt: item.createdAt,
        taskNumber: item.taskNumber,
        isArchived: item.isArchived || false,
      }))
      setTasks(formattedTasks)
      setFilteredTasks(formattedTasks)
    } catch (err) {
      setError("Не удалось загрузить задачи")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch("/api/users")

      if (!response.ok) {
        throw new Error("Не удалось загрузить пользователей")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
      const formattedUsers = data.map((item: any) => ({
        id: item.id,
        name: item.name,
      }))

      setUsers(formattedUsers)
    } catch (err) {
      console.error("Ошибка при загрузке пользователей:", err)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const filterTasks = () => {
    let result = [...tasks]

    if (searchTerm) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (task.assignee?.name && task.assignee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          false,
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter)
    }

    if (networkTypeFilter !== "all") {
      result = result.filter((task) => task.networkType === networkTypeFilter)
    }

    setFilteredTasks(result)
  }

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "NEW":
        return "bg-blue-500"
      case "IN_PROGRESS":
        return "bg-yellow-500"
      case "REVIEW":
        return "bg-purple-500"
      case "COMPLETED":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "HIGH":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: Task["status"]) => {
    switch (status) {
      case "NEW":
        return "Новый"
      case "IN_PROGRESS":
        return "Идёт настройка"
      case "REVIEW":
        return "Готов"
      case "COMPLETED":
        return "Выдан"
      default:
        return status
    }
  }

  const getPriorityText = (priority: Task["priority"]) => {
    switch (priority) {
      case "LOW":
        return "Низкий"
      case "MEDIUM":
        return "Средний"
      case "HIGH":
        return "Высокий"
      default:
        return priority
    }
  }

  const getNetworkTypeText = (networkType: Task["networkType"]) => {
    switch (networkType) {
      case "EMVS":
        return "ЕМВС"
      case "INTERNET":
        return "Интернет"
      case "ASZI":
        return "АСЗИ"
      default:
        return networkType
    }
  }

  const getNetworkTypeColor = (networkType: Task["networkType"]) => {
    switch (networkType) {
      case "EMVS":
        return "bg-blue-100 text-blue-800"
      case "INTERNET":
        return "bg-green-100 text-green-800"
      case "ASZI":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Функция для получения инициалов из имени
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const createTask = async (data: z.infer<typeof taskSchema>) => {
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
      // Преобразуем пустую строку в null для assigneeId
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

      // Добавляем новую задачу в список
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

      form.reset()
    } catch (err) {
      console.error("Ошибка при создании настройки АРМ:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось создать настройку АРМ",
        variant: "destructive",
      })
    } finally {
      setIsAddingTask(false)
    }
  }
  const updateTask = async (data: z.infer<typeof taskSchema>) => {
    if (!currentTask) return

    setIsEditingTask(true)

    try {
      // Преобразуем специальное значение в null для assigneeId
      const assigneeId = data.assigneeId === "not_assigned" ? null : data.assigneeId

      const response = await fetch(`/api/tasks/${currentTask.id}`, {
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

      // Обновляем задачу в списке
      setTasks((prev) =>
        prev.map((task) =>
          task.id === currentTask.id
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

      setCurrentTask(null)
    } catch (err) {
      console.error("Ошибка при обновлении настройки АРМ:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить настройку АРМ",
        variant: "destructive",
      })
    } finally {
      setIsEditingTask(false)
    }
  }

  const deleteTask = (task: Task) => {
    setTaskToDelete(task) // Устанавливаем задачу для подтверждения
  }

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return

    setIsDeletingTask(true)

    try {
      const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить настройку АРМ")
      }

      // Удаляем задачу из списка
      setTasks((prev) => prev.filter((task) => task.id !== taskToDelete.id))

      toast({
        title: "Успешно",
        description: "Настройка АРМ успешно удалена",
      })
    } catch (err) {
      console.error("Ошибка при удалении настройки АРМ:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить настройку АРМ",
        variant: "destructive",
      })
    } finally {
      setTaskToDelete(null)
      setIsDeletingTask(false)
    }
  }

  // Функция для быстрого обновления статуса
  const quickUpdateStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      // Оптимистичное обновление UI
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

      toast({
        title: "Статус обновлен",
        description: `Статус изменен на "${getStatusText(newStatus)}"`,
      })

      // Обновляем список задач для синхронизации с сервером
      fetchTasks()
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive",
      })
      // Откатываем изменения в случае ошибки
      fetchTasks()
    }
  }

  // Функция для быстрого обновления типа сети
  const quickUpdateNetworkType = async (taskId: string, newNetworkType: Task["networkType"]) => {
    try {
      // Оптимистичное обновление UI
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

      toast({
        title: "Тип сети обновлен",
        description: `Тип сети изменен на "${getNetworkTypeText(newNetworkType)}"`,
      })

      // Обновляем список задач для синхронизации с сервером
      fetchTasks()
    } catch (error) {
      console.error("Ошибка при обновлении типа сети:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить тип сети",
        variant: "destructive",
      })
      // Откатываем изменения в случае ошибки
      fetchTasks()
    }
  }

  const quickUpdatePriority = async (taskId: string, newPriority: Task["priority"]) => {
    try {
      // Оптимистичное обновление UI
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

      toast({
        title: "Приоритет обновлен",
        description: `Приоритет изменен на "${getPriorityText(newPriority)}"`,
      })

      // Обновляем список задач для синхронизации с сервером
      fetchTasks()
    } catch (error) {
      console.error("Ошибка при обновлении приоритета:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить приоритет",
        variant: "destructive",
      })
      // Откатываем изменения в случае ошибки
      fetchTasks()
    }
  }

  const archiveTask = async (taskId: string) => {
    try {
      // Оптимистичное обновление UI
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

      toast({
        title: "Задача архивирована",
        description: "Задача успешно перемещена в архив",
      })

      // Обновляем список задач для синхронизации с сервером
      fetchTasks()
    } catch (error) {
      console.error("Ошибка при архивировании задачи:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось архивировать задачу",
        variant: "destructive",
      })
      // Откатываем изменения в случае ошибки
      fetchTasks()
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-destructive/10 rounded-md">
          <h3 className="font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
          <Button onClick={fetchTasks} className="mt-2">
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {showArchived ? "Архив настроек АРМ" : "Настройка АРМ"}
        </h2>
      </div>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск по названию, описанию или исполнителю..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="NEW">Новый</SelectItem>
              <SelectItem value="IN_PROGRESS">Идёт настройка</SelectItem>
              <SelectItem value="REVIEW">Готов</SelectItem>
              <SelectItem value="COMPLETED">Выдан</SelectItem>
            </SelectContent>
          </Select>
          <Select value={networkTypeFilter} onValueChange={setNetworkTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Все сети" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все сети</SelectItem>
              <SelectItem value="EMVS">ЕМВС</SelectItem>
              <SelectItem value="INTERNET">Интернет</SelectItem>
              <SelectItem value="ASZI">АСЗИ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived">
              {showArchived ? "Показать активные" : "Показать архивные"}
            </Label>
          </div>

          {!showArchived && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-1">
                  <Plus className="h-4 w-4" />
                  <span>Новая настройка АРМ</span>
                </Button>
              </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новую настройку АРМ</DialogTitle>
              <DialogDescription>
                Заполните информацию о настройке АРМ. Поля, отмеченные *, обязательны для заполнения.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(createTask)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название настройки АРМ *</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название настройки АРМ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Опишите настройку АРМ подробнее" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Приоритет *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите приоритет" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Низкий</SelectItem>
                            <SelectItem value="MEDIUM">Средний</SelectItem>
                            <SelectItem value="HIGH">Высокий</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Статус *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите статус" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NEW">Новый</SelectItem>
                            <SelectItem value="IN_PROGRESS">Идёт настройка</SelectItem>
                            <SelectItem value="REVIEW">Готов</SelectItem>
                            <SelectItem value="COMPLETED">Выдан</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="networkType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип сети *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип сети" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EMVS">ЕМВС</SelectItem>
                            <SelectItem value="INTERNET">Интернет</SelectItem>
                            <SelectItem value="ASZI">АСЗИ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Срок выполнения</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Исполнитель</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите исполнителя" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="not_assigned">Не назначен</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isAddingTask}>
                    {isAddingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Создать настройку АРМ
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          )}

        {/* Диалог редактирования задачи */}
        <Dialog open={!!currentTask} onOpenChange={(open) => !open && setCurrentTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать настройку АРМ</DialogTitle>
              <DialogDescription>Измените информацию о настройке АРМ.</DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(updateTask)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название настройки АРМ *</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название настройки АРМ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Опишите настройку АРМ подробнее" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Статус *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите статус" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NEW">Новый</SelectItem>
                            <SelectItem value="IN_PROGRESS">Идёт настройка</SelectItem>
                            <SelectItem value="REVIEW">Готов</SelectItem>
                            <SelectItem value="COMPLETED">Выдан</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Приоритет *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите приоритет" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Низкий</SelectItem>
                            <SelectItem value="MEDIUM">Средний</SelectItem>
                            <SelectItem value="HIGH">Высокий</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="networkType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип сети *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип сети" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EMVS">ЕМВС</SelectItem>
                            <SelectItem value="INTERNET">Интернет</SelectItem>
                            <SelectItem value="ASZI">АСЗИ</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Срок выполнения</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="assigneeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Исполнитель</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите исполнителя" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="not_assigned">Не назначен</SelectItem>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCurrentTask(null)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={isEditingTask}>
                    {isEditingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Сохранить изменения
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Диалог подтверждения удаления задачи */}
        <Dialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подтверждение удаления</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить настройку АРМ "{taskToDelete?.title}"?
                <br />
                Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTaskToDelete(null)}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={confirmDeleteTask} disabled={isDeletingTask}>
                {isDeletingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Исполнитель</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Приоритет</TableHead>
              <TableHead>Тип сети</TableHead>
              <TableHead>Срок</TableHead>
              <TableHead className="w-[80px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[60px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TableRow key={task.id} className={task.isArchived ? "opacity-60 bg-muted/30" : ""}>
                  <TableCell className="font-medium">{task.taskNumber}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {task.title}
                      {task.isArchived && (
                        <Badge variant="secondary" className="text-xs">
                          Архив
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{task.description || "-"}</TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar || ""} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Не назначен</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent group">
                          <Badge className={`cursor-pointer transition-all duration-200 group-hover:scale-105 ${getStatusColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <div className="px-2 py-1.5 text-sm font-semibold">Изменить статус</div>
                        <div className="-mx-1 my-1 h-px bg-muted"></div>
                        <DropdownMenuItem 
                          onClick={() => quickUpdateStatus(task.id, "NEW")}
                          className={task.status === "NEW" ? "bg-accent" : ""}
                        >
                          <Badge className="mr-2">Новый</Badge>
                          {task.status === "NEW" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => quickUpdateStatus(task.id, "IN_PROGRESS")}
                          className={task.status === "IN_PROGRESS" ? "bg-accent" : ""}
                        >
                          <Badge className="mr-2">Идёт настройка</Badge>
                          {task.status === "IN_PROGRESS" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => quickUpdateStatus(task.id, "REVIEW")}
                          className={task.status === "REVIEW" ? "bg-accent" : ""}
                        >
                          <Badge className="mr-2">Готов</Badge>
                          {task.status === "REVIEW" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => quickUpdateStatus(task.id, "COMPLETED")}
                          className={task.status === "COMPLETED" ? "bg-accent" : ""}
                        >
                          <Badge className="mr-2">Выдан</Badge>
                          {task.status === "COMPLETED" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent group">
                          <Badge variant="secondary" className={`cursor-pointer transition-all duration-200 group-hover:scale-105 ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <div className="px-2 py-1.5 text-sm font-semibold">Изменить приоритет</div>
                        <div className="-mx-1 my-1 h-px bg-muted"></div>
                        <DropdownMenuItem 
                          onClick={() => quickUpdatePriority(task.id, "LOW")}
                          className={task.priority === "LOW" ? "bg-accent" : ""}
                        >
                          <Badge className="mr-2">Низкий</Badge>
                          {task.priority === "LOW" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => quickUpdatePriority(task.id, "MEDIUM")}
                          className={task.priority === "MEDIUM" ? "bg-accent" : ""}
                        >
                          <Badge className="mr-2">Средний</Badge>
                          {task.priority === "MEDIUM" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => quickUpdatePriority(task.id, "HIGH")}
                          className={task.priority === "HIGH" ? "bg-accent" : ""}
                        >
                          <Badge className="mr-2">Высокий</Badge>
                          {task.priority === "HIGH" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent group">
                          <Badge variant="outline" className={`cursor-pointer transition-all duration-200 group-hover:scale-105 ${getNetworkTypeColor(task.networkType)}`}>
                            {getNetworkTypeText(task.networkType)}
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <div className="px-2 py-1.5 text-sm font-semibold">Изменить тип сети</div>
                        <div className="-mx-1 my-1 h-px bg-muted"></div>
                        <DropdownMenuItem 
                          onClick={() => quickUpdateNetworkType(task.id, "EMVS")}
                          className={task.networkType === "EMVS" ? "bg-accent" : ""}
                        >
                          <Badge className="mr-2">ЕМВС</Badge>
                          {task.networkType === "EMVS" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => quickUpdateNetworkType(task.id, "INTERNET")}
                          className={task.networkType === "INTERNET" ? "bg-accent" : ""}
                        >
                          <Badge className="mr-2">Интернет</Badge>
                          {task.networkType === "INTERNET" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => quickUpdateNetworkType(task.id, "ASZI")}
                          className={task.networkType === "ASZI" ? "bg-accent" : ""}
                        >
                          <Badge className="mr-2">АСЗИ</Badge>
                          {task.networkType === "ASZI" && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString("ru-RU") : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Действия</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setCurrentTask(task)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Редактировать</span>
                        </DropdownMenuItem>
                        {!task.isArchived && (
                          <DropdownMenuItem onClick={() => archiveTask(task.id)}>
                            <Archive className="mr-2 h-4 w-4" />
                            <span>Архивировать</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteTask(task)}>
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Удалить</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  {showArchived ? "Архивные настройки АРМ не найдены." : "Настройки АРМ не найдены."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

