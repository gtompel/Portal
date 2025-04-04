"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Loader2, Edit, Trash } from "lucide-react"
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
  dueDate: string | null
  createdAt: string
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  // Форма создания/редактирования задачи
  const taskSchema = z.object({
    title: z.string().min(3, "Название должно содержать минимум 3 символа"),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
    status: z.enum(["NEW", "IN_PROGRESS", "REVIEW", "COMPLETED"]),
    dueDate: z.string().optional(),
    assigneeId: z.string().optional(),
  })

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "NEW",
      dueDate: "",
      assigneeId: "",
    },
  })

  const editForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "NEW",
      dueDate: "",
      assigneeId: "",
    },
  })

  useEffect(() => {
    fetchTasks()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (tasks.length) {
      filterTasks()
    }
  }, [searchTerm, statusFilter, tasks])

  useEffect(() => {
    if (currentTask) {
      // Заполняем форму редактирования данными текущей задачи
      editForm.reset({
        title: currentTask.title,
        description: currentTask.description || "",
        priority: currentTask.priority,
        status: currentTask.status,
        dueDate: currentTask.dueDate || "",
        assigneeId: currentTask.assignee?.id || "",
      })
    }
  }, [currentTask, editForm])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/tasks")

      if (!response.ok) {
        throw new Error("Не удалось загрузить задачи")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
      const formattedTasks = data.map((item: any) => ({
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
        dueDate: item.dueDate,
        createdAt: item.createdAt,
      }))

      setTasks(formattedTasks)
      setFilteredTasks(formattedTasks)
    } catch (err) {
      console.error("Ошибка при загрузке задач:", err)
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
          task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.assignee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          false,
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter)
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
        return "Новая"
      case "IN_PROGRESS":
        return "В работе"
      case "REVIEW":
        return "На проверке"
      case "COMPLETED":
        return "Завершена"
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

  // Функция для получения инициалов из имени Функция для получения инициалов из имени
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
        description: "Вы должны быть авторизованы для создания задач",
        variant: "destructive",
      })
      return
    }

    setIsAddingTask(true)

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          creatorId: session.user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось создать задачу")
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
        dueDate: newTask.dueDate,
        createdAt: newTask.createdAt,
      }

      setTasks((prev) => [formattedTask, ...prev])

      toast({
        title: "Успешно",
        description: "Задача успешно создана",
      })

      form.reset()
    } catch (err) {
      console.error("Ошибка при создании задачи:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось создать задачу",
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
      const response = await fetch(`/api/tasks/${currentTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Не удалось обновить задачу")
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
                dueDate: updatedTask.dueDate,
              }
            : task,
        ),
      )

      toast({
        title: "Успешно",
        description: "Задача успешно обновлена",
      })

      setCurrentTask(null)
    } catch (err) {
      console.error("Ошибка при обновлении задачи:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить задачу",
        variant: "destructive",
      })
    } finally {
      setIsEditingTask(false)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить задачу")
      }

      // Удаляем задачу из списка
      setTasks((prev) => prev.filter((task) => task.id !== id))

      toast({
        title: "Успешно",
        description: "Задача успешно удалена",
      })
    } catch (err) {
      console.error("Ошибка при удалении задачи:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить задачу",
        variant: "destructive",
      })
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
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск задач..."
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
              <SelectItem value="NEW">Новая</SelectItem>
              <SelectItem value="IN_PROGRESS">В работе</SelectItem>
              <SelectItem value="REVIEW">На проверке</SelectItem>
              <SelectItem value="COMPLETED">Завершена</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Новая задача</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новую задачу</DialogTitle>
              <DialogDescription>
                Заполните информацию о задаче. Поля, отмеченные *, обязательны для заполнения.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(createTask)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название задачи *</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название задачи" {...field} />
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
                        <Textarea placeholder="Опишите задачу подробнее" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                </div>

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

                <DialogFooter>
                  <Button type="submit" disabled={isAddingTask}>
                    {isAddingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Создать задачу
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Диалог редактирования задачи */}
        <Dialog open={!!currentTask} onOpenChange={(open) => !open && setCurrentTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать задачу</DialogTitle>
              <DialogDescription>Измените информацию о задаче.</DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(updateTask)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название задачи *</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название задачи" {...field} />
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
                        <Textarea placeholder="Опишите задачу подробнее" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="NEW">Новая</SelectItem>
                            <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                            <SelectItem value="REVIEW">На проверке</SelectItem>
                            <SelectItem value="COMPLETED">Завершена</SelectItem>
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
                            <SelectItem value="">Не назначен</SelectItem>
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Исполнитель</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Приоритет</TableHead>
              <TableHead>Срок</TableHead>
              <TableHead className="w-[80px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.id}</TableCell>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.assignee?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(task.status)} text-white`}>
                      {getStatusText(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {getPriorityText(task.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString("ru-RU") : "-"}</TableCell>
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
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteTask(task.id)}>
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
                <TableCell colSpan={7} className="h-24 text-center">
                  Задачи не найдены.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

